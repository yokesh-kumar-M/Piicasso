from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from ..persistence.models import Team, TeamMembership, TeamMessage
from ..services.auth_service import AuthService
from ..services.team_service import TeamService
from .serializers import (
    MyTokenObtainPairSerializer,
    RegisterSerializer,
    TeamMessageSerializer,
    TeamSerializer,
)

User = get_user_model()


class PingView(APIView):
    """Health check endpoint to verify the server is awake."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "message": "Server is awake"}, status=status.HTTP_200_OK)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_user(
            username=serializer.validated_data["username"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        tokens = AuthService.generate_tokens_for_user(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        id_token_str = request.data.get("credential") or request.data.get("id_token")
        if not id_token_str:
            return Response({"error": "Google ID token required."}, status=status.HTTP_400_BAD_REQUEST)

        user = AuthService.verify_google_token(id_token_str)
        tokens = AuthService.generate_tokens_for_user(user)
        return Response(tokens, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        AuthService.request_password_reset(email)
        return Response(
            {"detail": "If an account with that email exists, a reset code was sent."},
            status=status.HTTP_200_OK,
        )


class VerifyResetOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")

        if not email or not otp or not new_password:
            return Response(
                {"error": "Email, verification code, and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        AuthService.verify_otp_and_reset_password(email, otp, new_password)
        return Response({"detail": "Password reset successfully."}, status=status.HTTP_200_OK)


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return teams the user is a member of
        return Team.objects.filter(members__user=self.request.user)

    def create(self, request, *args, **kwargs):
        name = request.data.get("name")
        if not name:
            return Response({"error": "Team name is required."}, status=status.HTTP_400_BAD_REQUEST)
        team = TeamService.create_team(request.user, name)
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="join")
    def join_team(self, request):
        invite_code = request.data.get("invite_code")
        if not invite_code:
            return Response({"error": "Invite code is required."}, status=status.HTTP_400_BAD_REQUEST)
        membership = TeamService.join_team(request.user, invite_code)
        return Response(TeamSerializer(membership.team).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="leave")
    def leave_team(self, request):
        result = TeamService.leave_team(request.user)
        return Response(result, status=status.HTTP_200_OK)


class TeamMessageViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_teams = Team.objects.filter(members__user=self.request.user)
        return TeamMessage.objects.filter(team__in=user_teams).select_related("sender", "team")

    def create(self, request, *args, **kwargs):
        team_id = request.data.get("team")
        content = request.data.get("content")
        team = Team.objects.filter(id=team_id).first()
        if not team:
            return Response({"error": "Team not found."}, status=status.HTTP_404_NOT_FOUND)

        msg = TeamService.post_message(team, request.user, content)
        return Response(TeamMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

