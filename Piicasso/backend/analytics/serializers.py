from rest_framework import serializers
from .models import UserActivity

class UserActivitySerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="%H:%M:%S") # Just time for the ticker

    class Meta:
        model = UserActivity
        fields = ['id', 'activity_type', 'description', 'timestamp', 'latitude', 'longitude', 'color', 'intensity', 'city']
