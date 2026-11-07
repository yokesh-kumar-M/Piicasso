from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..persistence.models import Message, Notification, SystemLog, SystemSetting, UserActivity
from ..services.telemetry_service import TelemetryService
from ..services.terminal_service import TerminalService
from .serializers import (
    GlobeDataSerializer,
    MessageSerializer,
    NotificationSerializer,
    SystemLogSerializer,
    SystemSettingSerializer,
)

User = get_user_model()


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "healthy", "service": "Pantheon Cluster"}, status=status.HTTP_200_OK)


class GlobeDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = TelemetryService.get_globe_data(limit=150)
        return Response(data, status=status.HTTP_200_OK)


class SimulatedTerminalView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        command = request.data.get("command", "")
        output = TerminalService.execute_command(command, user=request.user)
        return Response({"output": output}, status=status.HTTP_200_OK)


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = SystemLogSerializer
    queryset = SystemLog.objects.all()


class SystemLogView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = SystemLog.objects.all()[:100]
        return Response(SystemLogSerializer(logs, many=True).data, status=status.HTTP_200_OK)


class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(recipient=user))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class SystemSettingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = SystemSettingSerializer
    queryset = SystemSetting.objects.all()


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    users = User.objects.all().order_by("-date_joined")[:100]
    return Response(
        [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
            }
            for u in users
        ],
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_purge_all(request):
    from golem.persistence.models import GenerationHistory

    GenerationHistory.objects.all().delete()
    SystemLog.objects.create(level="WARNING", message="Admin purged all generation history records.")
    return Response({"message": "Purged all generation records successfully."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def super_admin_view(request):
    return Response(
        {
            "total_users": User.objects.count(),
            "total_logs": SystemLog.objects.count(),
            "status": "System Normal",
        },
        status=status.HTTP_200_OK,
    )

