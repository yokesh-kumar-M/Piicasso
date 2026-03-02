from rest_framework import serializers
from .models import UserActivity

class UserActivitySerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="iso-8601")

    class Meta:
        model = UserActivity
        fields = ['id', 'activity_type', 'description', 'timestamp', 'latitude', 'longitude', 'color', 'intensity', 'city']
