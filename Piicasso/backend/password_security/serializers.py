from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PasswordAnalysis, UserPreference

User = get_user_model()


class PasswordAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordAnalysis
        fields = [
            'id', 'user', 'pii_data', 'password_hash', 
            'vulnerability_level', 'strength_score', 
            'crack_time_estimate', 'breach_count',
            'recommendations', 'vulnerabilities_found', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'password_hash', 'created_at']


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['id', 'user', 'default_mode', 'last_mode', 'updated_at']
        read_only_fields = ['id', 'user', 'updated_at']
