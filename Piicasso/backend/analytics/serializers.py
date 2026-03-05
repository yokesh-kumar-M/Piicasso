from rest_framework import serializers
from .models import UserActivity


class UserActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for globe data. Excludes 'description' field to prevent
    leaking usernames and operational details to all authenticated users.
    """
    timestamp = serializers.DateTimeField(format="iso-8601")

    class Meta:
        model = UserActivity
        fields = ['id', 'activity_type', 'timestamp', 'latitude', 'longitude', 'color', 'intensity', 'city']
