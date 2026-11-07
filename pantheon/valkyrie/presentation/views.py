import hashlib
import os

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..persistence.models import PasswordAnalysis, PasswordAuditLog, UserPreference
from ..services.entropy_service import EntropyService
from ..services.hibp_service import HibpService
from .serializers import (
    BreachSearchRequestSerializer,
    PasswordAuditLogSerializer,
    PasswordScoreRequestSerializer,
    PasswordScoreResponseSerializer,
    UserPreferenceSerializer,
)


class PasswordScoreView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordScoreRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data["password"]
        pii_data = serializer.validated_data.get("pii_data", {})

        evaluation = EntropyService.evaluate_password(password, pii_data)
        breach_count = HibpService.get_breach_count(password)
        evaluation["breach_count"] = max(0, breach_count)

        if breach_count > 0:
            evaluation["vulnerabilities"].insert(0, f"Exposed in {breach_count:,} public data breaches!")
            evaluation["vulnerability_level"] = "critical"
            evaluation["strength_score"] = min(evaluation["strength_score"], 20)

        if request.user.is_authenticated:
            pw_hash = hashlib.sha256(password.encode()).hexdigest()
            PasswordAnalysis.objects.create(
                user=request.user,
                pii_data=pii_data,
                password_hash=pw_hash,
                vulnerability_level=evaluation["vulnerability_level"],
                strength_score=evaluation["strength_score"],
                crack_time_estimate=evaluation["crack_time_estimate"],
                breach_count=evaluation["breach_count"],
                recommendations=evaluation["recommendations"],
                vulnerabilities_found=evaluation["vulnerabilities"],
            )
            PasswordAuditLog.objects.create(
                user=request.user,
                action="analyze",
                details={"score": evaluation["strength_score"], "level": evaluation["vulnerability_level"]},
            )

        return Response(evaluation, status=status.HTTP_200_OK)


class BreachSearchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BreachSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["query"]

        api_key = getattr(settings, "HIBP_API_KEY", "") or os.getenv("HIBP_API_KEY")
        breaches = HibpService.search_account_breaches(query, api_key=api_key)

        return Response({"account": query, "breaches": breaches, "count": len(breaches)}, status=status.HTTP_200_OK)


class UserPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = UserPreference.objects.get_or_create(user=request.user)
        return Response(UserPreferenceSerializer(pref).data, status=status.HTTP_200_OK)

    def post(self, request):
        pref, _ = UserPreference.objects.get_or_create(user=request.user)
        mode = request.data.get("default_mode") or request.data.get("mode")
        if mode in ["user", "security"]:
            pref.default_mode = mode
            pref.last_mode = mode
            pref.save()
        return Response(UserPreferenceSerializer(pref).data, status=status.HTTP_200_OK)


class PasswordAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordAuditLogSerializer

    def get_queryset(self):
        return PasswordAuditLog.objects.filter(user=self.request.user)

