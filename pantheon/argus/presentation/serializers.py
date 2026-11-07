from rest_framework import serializers

from ..persistence.models import Message, Notification, SystemLog, SystemSetting, UserActivity


class SystemLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemLog
        fields = ("id", "timestamp", "level", "message", "source")


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    recipient_username = serializers.CharField(source="recipient.username", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "sender_username", "recipient", "recipient_username", "content", "timestamp", "is_read")
        read_only_fields = ("sender", "timestamp")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "notification_type", "title", "description", "is_read", "timestamp", "link")


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ("key", "value", "description", "updated_at")


class GlobeDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ("latitude", "longitude", "city", "country_code", "activity_type", "description", "color", "intensity", "timestamp")

