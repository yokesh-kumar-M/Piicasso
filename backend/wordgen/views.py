import csv
import json

from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

from .llm_handler import build_prompt, call_gemini_api
from .models import GenerationHistory
from .serializers import Piiserializer


class RegisterView(APIView):
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
    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if serializer.is_valid():
            pii_data = serializer.validated_data

            # Check if any data was provided
            if not any(pii_data.values()):
                return Response({"error": "No PII data provided"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                print(f"PII Data received: {pii_data}")  # Log PII data
                prompt = build_prompt(pii_data)
                print(f"Generated prompt: {prompt}")  # Log prompt
                wordlist_raw = call_gemini_api(prompt)
                print(f"Raw wordlist from Gemini: {wordlist_raw}")  # Log raw wordlist

                if wordlist_raw.startswith("Error"):
                    return Response({"error": wordlist_raw}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Clean and validate wordlist
                wordlist = [line.strip() for line in wordlist_raw.split("\n") if line.strip()]
                print(f"Cleaned wordlist: {wordlist}")  # Log cleaned wordlist
                
                if not wordlist:
                    return Response({"error": "No valid passwords generated"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Save to database
                GenerationHistory.objects.create(
                    pii_data=pii_data,
                    wordlist=wordlist,
                    ip_address=self.get_client_ip(request)
                )

                return Response({"wordlist": wordlist})

            except Exception as e:
                print(f"Exception during wordlist generation: {str(e)}")  # Log exceptions
                return Response({"error": f"Failed to generate wordlist: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            history = GenerationHistory.objects.all().order_by('-timestamp')[:50]
            data = [
                {
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "wordlist_count": len(h.wordlist) if h.wordlist else 0,
                    "pii_data": h.pii_data,
                    "ip_address": h.ip_address
                }
                for h in history
            ]
            return Response(data)
        except Exception as e:
            return Response({"error": f"Failed to fetch history: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    """Deletes a specific history entry."""
    try:
        record = GenerationHistory.objects.get(id=id)
        record.delete()
        return Response({"message": "History entry deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "History entry not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Failed to delete history entry: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def download_wordlist(request, id):
    """Download a specific wordlist as a text file"""
    try:
        record = GenerationHistory.objects.get(id=id)
        wordlist_text = "\n".join(record.wordlist)
        response = HttpResponse(wordlist_text, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return response
    except GenerationHistory.DoesNotExist:
        return HttpResponse("Wordlist not found", status=404)
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)


def export_history_csv(request):
    """Export generation history as CSV"""
    try:
        rows = GenerationHistory.objects.all().order_by('-timestamp')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=history.csv'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Timestamp', 'IP Address', 'PII Data', 'Wordlist Count', 'Sample Passwords'])

        for r in rows:
            sample_passwords = ', '.join(r.wordlist[:5]) + ('...' if len(r.wordlist) > 5 else '') if r.wordlist else 'N/A'
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
        return HttpResponse(f"Error generating CSV: {str(e)}", status=500)
        return HttpResponse(f"Error generating CSV: {str(e)}", status=500)