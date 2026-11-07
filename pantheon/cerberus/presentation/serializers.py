from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ..persistence.models import Team, TeamMembership, TeamMessage

User = get_user_model()


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["is_superuser"] = user.is_superuser
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password")


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ("id", "user", "role", "joined_at")


class TeamSerializer(serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ("id", "name", "invite_code", "created_at", "owner", "members")
        read_only_fields = ("invite_code", "created_at", "owner")


class TeamMessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)

    class Meta:
        model = TeamMessage
        fields = ("id", "team", "sender", "content", "timestamp")
        read_only_fields = ("team", "sender", "timestamp")

