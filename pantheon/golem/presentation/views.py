import uuid
from io import BytesIO

from django.core.cache import cache
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import FileResponse, HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..persistence.models import GenerationHistory
from ..services.ai_generator_service import AiGeneratorService
from ..services.export_service import ExportService
from .serializers import GenerationHistorySerializer, PiiSubmitSerializer

_download_signer = TimestampSigner(salt="piicasso-download")


class PiiSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PiiSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pattern_mode = data.pop("pattern_mode", "standard")
        limit = data.pop("limit", 500)

        wordlist = AiGeneratorService.generate_wordlist(data, pattern_mode=pattern_mode, limit=limit)

        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        user = request.user if request.user.is_authenticated else None
        history = GenerationHistory.objects.create(
            user=user,
            pii_data=data,
            wordlist=wordlist,
            wordlist_count=len(wordlist),
            ip_address=ip,
        )

        cache_key = f"wordlist_{uuid.uuid4().hex[:12]}"
        cache.set(cache_key, wordlist, timeout=3600)

        return Response(
            {
                "id": history.id,
                "cache_key": cache_key,
                "wordlist_count": len(wordlist),
                "wordlist": wordlist[:100],  # preview
            },
            status=status.HTTP_201_CREATED,
        )


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        entries = GenerationHistory.objects.filter(user=request.user).order_by("-timestamp")[:limit]
        serializer = GenerationHistorySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    entry = GenerationHistory.objects.filter(id=id, user=request.user).first()
    if not entry:
        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)
    entry.delete()
    return Response({"message": "Entry deleted successfully."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_cached_wordlist(request, cache_key):
    wordlist = cache.get(cache_key)
    if not wordlist:
        return Response({"error": "Cache expired or invalid key."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"wordlist": wordlist}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    entry = GenerationHistory.objects.filter(id=id, user=request.user).first()
    if not entry:
        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)

    content = "\n".join(entry.wordlist or [])
    response = HttpResponse(content, content_type="text/plain")
    response["Content-Disposition"] = f'attachment; filename="wordlist_{id}.txt"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_report_pdf(request, id):
    entry = GenerationHistory.objects.filter(id=id, user=request.user).first()
    if not entry:
        return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)

    buffer = BytesIO()
    ExportService.generate_report_pdf(entry, buffer)
    buffer.seek(0)
    return FileResponse(buffer, as_attachment=True, filename=f"report_{id}.pdf")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    entries = GenerationHistory.objects.filter(user=request.user).order_by("-timestamp")
    buffer = ExportService.export_history_to_csv(entries)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="generation_history.csv"'
    return response


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    if request.method == "GET":
        return Response(
            {
                "username": user.username,
                "email": user.email,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined,
            },
            status=status.HTTP_200_OK,
        )

    email = request.data.get("email")
    if email:
        user.email = email
        user.save()
    return Response({"message": "Profile updated."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_stats(request):
    user = request.user
    history_count = GenerationHistory.objects.filter(user=user).count()
    return Response(
        {
            "total_generations": history_count,
            "username": user.username,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_download_token(request):
    file_type = request.data.get("file_type", "wordlist")
    target_id = request.data.get("id")
    if not target_id:
        return Response({"error": "ID is required."}, status=status.HTTP_400_BAD_REQUEST)

    payload = f"{request.user.id}:{file_type}:{target_id}"
    token = _download_signer.sign(payload)
    return Response({"download_token": token}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def download_file_with_token(request, file_type, id):
    token = request.query_params.get("token")
    if not token:
        return Response({"error": "Missing download token."}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        unsigned = _download_signer.unsign(token, max_age=60)
        user_id, token_file_type, token_id = unsigned.split(":")
        if token_file_type != file_type or str(token_id) != str(id):
            return Response({"error": "Token payload mismatch."}, status=status.HTTP_403_FORBIDDEN)
    except (BadSignature, SignatureExpired, ValueError):
        return Response({"error": "Invalid or expired token."}, status=status.HTTP_403_FORBIDDEN)

    entry = GenerationHistory.objects.filter(id=id).first()
    if not entry:
        return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

    if file_type == "pdf":
        buffer = BytesIO()
        ExportService.generate_report_pdf(entry, buffer)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f"report_{id}.pdf")

    content = "\n".join(entry.wordlist or [])
    response = HttpResponse(content, content_type="text/plain")
    response["Content-Disposition"] = f'attachment; filename="wordlist_{id}.txt"'
    return response

