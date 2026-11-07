from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class SystemLog(models.Model):
    LEVEL_CHOICES = [
        ("INFO", "Info"),
        ("WARNING", "Warning"),
        ("ERROR", "Error"),
        ("CRITICAL", "Critical"),
        ("SUCCESS", "Success"),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="INFO")
    message = models.TextField()
    source = models.CharField(max_length=50, default="SYSTEM")

    class Meta:
        db_table = "ArgusSystemLogs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["level"]),
            models.Index(fields=["source"]),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.level}: {self.message}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = "ArgusMessages"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["sender"]),
            models.Index(fields=["sender", "recipient"]),
        ]

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient} at {self.timestamp}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("GENERATION", "Wordlist Generated"),
        ("TEAM", "Team Activity"),
        ("MESSAGE", "New Message"),
        ("SYSTEM", "System Alert"),
        ("SECURITY", "Security Alert"),
        ("ADMIN", "Admin Action"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default="SYSTEM")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "ArgusNotifications"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.username}"


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(default="")
    description = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "ArgusSystemSettings"
        ordering = ["key"]

    def __str__(self):
        return f"{self.key} = {self.value}"

    @classmethod
    def get(cls, key, default=""):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default
        except Exception:
            raise

    @classmethod
    def set(cls, key, value, user=None, description=""):
        obj, _ = cls.objects.update_or_create(
            key=key, defaults={"value": str(value), "updated_by": user, "description": description}
        )
        return obj


class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ("LOGIN", "User Login"),
        ("GENERATE", "Wordlist Generated"),
        ("SCAN", "Network Scan"),
        ("BREACH", "Data Breach Detected"),
        ("SQUAD_JOIN", "Squadron Joined"),
        ("TEAM_JOIN", "Team Joined"),
        ("CONFIG", "Configuration Change"),
    ]

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="activities",
        db_index=True,
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    country_code = models.CharField(max_length=3, default="UNK")
    city = models.CharField(max_length=100, default="Unknown")

    color = models.CharField(max_length=20, default="green")
    intensity = models.FloatField(default=0.5)

    class Meta:
        db_table = "ArgusTelemetry"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["activity_type", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.activity_type} at {self.city} ({self.latitude}, {self.longitude})"

    def save(self, *args, **kwargs):
        if self.activity_type == "BREACH":
            self.color = "#ef4444"
            self.intensity = 1.0
        elif self.activity_type == "GENERATE":
            self.color = "#eab308"
            self.intensity = 0.7
        elif self.activity_type == "LOGIN":
            self.color = "#22c55e"
            self.intensity = 0.4
        elif self.activity_type == "SCAN":
            self.color = "#3b82f6"
            self.intensity = 0.6
        elif self.activity_type in ("TEAM_JOIN", "SQUAD_JOIN"):
            self.color = "#a855f7"
            self.intensity = 0.5
        elif self.activity_type == "CONFIG":
            self.color = "#f97316"
            self.intensity = 0.3

        super().save(*args, **kwargs)

