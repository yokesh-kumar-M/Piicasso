import csv
import json

from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
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
            return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username=username, email=email, password=password)
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)


class PiiSubmitView(APIView):
    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if serializer.is_valid():
            pii_data = serializer.validated_data

            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt)

            if wordlist_raw.startswith("Error"):
                return Response({"error": wordlist_raw}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            wordlist = [line.strip() for line in wordlist_raw.split("\n") if line.strip()]

            GenerationHistory.objects.create(
                pii_data=pii_data,
                wordlist=wordlist,
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({"wordlist": wordlist})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HistoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = GenerationHistory.objects.all().order_by('-timestamp')[:50]
        data = [
            {
                "id": h.id,
                "timestamp": h.timestamp,
                "pii_data": h.pii_data,
                "wordlist": h.wordlist,
                "ip_address": h.ip_address
            }
            for h in history
        ]
        return Response(data)


def download_wordlist(request, id):
    try:
        record = GenerationHistory.objects.get(id=id)
        wordlist_text = "\n".join(record.wordlist)
        response = HttpResponse(wordlist_text, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return response
    except GenerationHistory.DoesNotExist:
        return HttpResponse("Not found", status=404)


def export_history_csv(request):
    rows = GenerationHistory.objects.all()
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename=history.csv'
    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'IP Address', 'PII Data', 'Wordlist (first 10)'])

    for r in rows:
        writer.writerow([
            r.timestamp,
            r.ip_address,
            json.dumps(r.pii_data),
            " | ".join(r.wordlist[:10]) + "..."
        ])

    return response
