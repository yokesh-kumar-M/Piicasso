import os
import csv
import json
from io import StringIO

from django.contrib.auth.models import User
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .llm_handler import build_prompt, call_gemini_api
from .models import GenerationHistory, UserProfile
from .serializers import Piiserializer
from .decorators import rate_limit

class PiiSubmitView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @rate_limit(key_prefix='pii_submit', limit=50, period=3600)  # 50 submissions per hour
    def post(self, request):
        # Check if user's email is verified
        profile = UserProfile.get_or_create_profile(request.user)
        if not profile.email_verified:
            return Response({
                "error": "Email verification required. Please verify your email address before using this feature.",
                "email_not_verified": True,
                "email": request.user.email
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data
        non_empty_values = [v for v in pii_data.values() if v and v != '' and v != []]
        if not non_empty_values:
            return Response({"error": "No meaningful PII data provided."}, status=status.HTTP_400_BAD_REQUEST)

        # API key check
        if not os.environ.get("GEMINI_API_KEY"):
            return Response({"error": "Generation service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)

            # Normalize to list
            wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]
            if not wordlist:
                return Response({"error": "No passwords generated."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if len(wordlist) > 1000:
                wordlist = wordlist[:1000]

            record = GenerationHistory.objects.create(
                user=request.user,
                pii_data=pii_data,
                wordlist=wordlist,
                ip_address=self.get_client_ip(request)
            )

            return Response({"wordlist": wordlist, "id": record.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Generation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @rate_limit(key_prefix='history_view', limit=100, period=3600)  # 100 history views per hour
    def get(self, request):
        # Check email verification
        profile = UserProfile.get_or_create_profile(request.user)
        if not profile.email_verified:
            return Response({
                "error": "Email verification required. Please verify your email address.",
                "email_not_verified": True,
                "email": request.user.email
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            start = (page - 1) * page_size
            end = start + page_size
            
            qs = GenerationHistory.objects.filter(user=request.user).order_by('-timestamp')
            total = qs.count()
            
            entries = qs[start:end]
            data = {
                'results': [{
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "pii_data": h.pii_data,
                    "wordlist": h.wordlist,
                    "ip_address": h.ip_address
                } for h in entries],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    # Check email verification
    profile = UserProfile.get_or_create_profile(request.user)
    if not profile.email_verified:
        return Response({
            "error": "Email verification required. Please verify your email address.",
            "email_not_verified": True,
            "email": request.user.email
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        r = GenerationHistory.objects.get(id=id, user=request.user)  # Ensure user owns the record
        r.delete()
        return Response({"message": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    # Check email verification
    profile = UserProfile.get_or_create_profile(request.user)
    if not profile.email_verified:
        return Response({
            "error": "Email verification required. Please verify your email address.",
            "email_not_verified": True,
            "email": request.user.email
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        r = GenerationHistory.objects.get(id=id, user=request.user)  # Ensure user owns the record
        txt = "\n".join(r.wordlist or [])
        resp = HttpResponse(txt, content_type='text/plain')
        resp['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return resp
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    # Check email verification
    profile = UserProfile.get_or_create_profile(request.user)
    if not profile.email_verified:
        return Response({
            "error": "Email verification required. Please verify your email address.",
            "email_not_verified": True,
            "email": request.user.email
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        rows = GenerationHistory.objects.filter(user=request.user).order_by('-timestamp')  # User's own data only
        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow(['ID', 'Timestamp', 'IP Address', 'PII Data', 'Wordlist Count', 'Sample Passwords'])
        for r in rows:
            sample = ', '.join((r.wordlist or [])[:5]) + ('...' if r.wordlist and len(r.wordlist) > 5 else '')
            writer.writerow([r.id, r.timestamp, r.ip_address, json.dumps(r.pii_data), len(r.wordlist or []), sample])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename=history.csv'
        return resp
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)