# backend/wordgen/views.py
import os
import csv
import json
from io import BytesIO

from django.contrib.auth.models import User
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .llm_handler import build_prompt, call_gemini_api
from .models import GenerationHistory
from .serializers import Piiserializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Missing required fields: username and password'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            User.objects.create_user(username=username, email=email, password=password)
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Failed to create user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PiiSubmitView(APIView):
    def get_client_ip(self, request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data

        # Ensure at least some meaningful value
        non_empty_values = [v for v in pii_data.values() if v and v != '' and v != []]
        if not non_empty_values:
            return Response({"error": "No meaningful PII data provided. Please fill in at least one field."}, status=status.HTTP_400_BAD_REQUEST)

        # Gemini API key check
        if not os.environ.get("GEMINI_API_KEY"):
            return Response({"error": "API service is not configured. Please contact administrator."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt)

            if isinstance(wordlist_raw, str) and wordlist_raw.startswith("Error"):
                return Response({"error": wordlist_raw}, status=status.HTTP_502_BAD_GATEWAY)

            # Normalize output to a clean list
            wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]
            if not wordlist:
                return Response({"error": "No valid passwords generated. Please try again with different data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Enforce limit
            if len(wordlist) > 1000:
                wordlist = wordlist[:1000]

            # Save record
            record = GenerationHistory.objects.create(
                pii_data=pii_data,
                wordlist=wordlist,
                ip_address=self.get_client_ip(request)
            )

            # Return generated list and record id for download if needed
            return Response({"wordlist": wordlist, "id": record.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Failed to generate wordlist: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            qs = GenerationHistory.objects.all().order_by('-timestamp')[:50]
            data = [
                {
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "pii_data": h.pii_data,
                    "wordlist": h.wordlist,
                    "ip_address": h.ip_address
                }
                for h in qs
            ]
            return Response(data)
        except Exception as e:
            return Response({"error": f"Failed to fetch history: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    try:
        record = GenerationHistory.objects.get(id=id)
        record.delete()
        return Response({"message": "History entry deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "History entry not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Failed to delete history entry: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    """Download a specific wordlist as a text file"""
    try:
        record = GenerationHistory.objects.get(id=id)
        wordlist_text = "\n".join(record.wordlist or [])
        response = HttpResponse(wordlist_text, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return response
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Wordlist not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    """Export generation history as CSV"""
    try:
        rows = GenerationHistory.objects.all().order_by('-timestamp')
        # Build CSV in memory
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=history.csv'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Timestamp', 'IP Address', 'PII Data', 'Wordlist Count', 'Sample Passwords'])

        for r in rows:
            sample_passwords = ', '.join((r.wordlist or [])[:5]) + ('...' if r.wordlist and len(r.wordlist) > 5 else '')
            writer.writerow([
                r.id,
                r.timestamp,
                r.ip_address,
                json.dumps(r.pii_data),
                len(r.wordlist) if r.wordlist else 0,
                sample_passwords
            ])

        return response
    except Exception as e:
        return Response({"error": f"Error generating CSV: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
