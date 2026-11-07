from rest_framework import serializers

from ..persistence.models import PasswordAnalysis, PasswordAuditLog, UserPreference


class PasswordScoreRequestSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, write_only=True)
    pii_data = serializers.DictField(required=False, default=dict)


class PasswordScoreResponseSerializer(serializers.Serializer):
    entropy = serializers.FloatField()
    strength_score = serializers.IntegerField()
    vulnerability_level = serializers.CharField()
    crack_time_estimate = serializers.CharField()
    breach_count = serializers.IntegerField()
    vulnerabilities = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=serializers.CharField())


class BreachSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ("default_mode", "last_mode", "updated_at")


class PasswordAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordAuditLog
        fields = ("id", "action", "ip_address", "details", "timestamp")

