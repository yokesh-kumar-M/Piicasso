from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SystemLog(models.Model):
    LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
        ('SUCCESS', 'Success'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='INFO')
    message = models.TextField()
    source = models.CharField(max_length=50, default='SYSTEM')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['level']),
            models.Index(fields=['source']),
        ]

    def __str__(self):
        return f"[{self.timestamp}] {self.level}: {self.message}"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['sender']),
            models.Index(fields=['sender', 'recipient']),  # 2.4 fix: composite index for conversation queries
        ]

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient} at {self.timestamp}"


class Notification(models.Model):
    """Real-time notifications for users."""
    NOTIFICATION_TYPES = [
        ('GENERATION', 'Wordlist Generated'),
        ('TEAM', 'Team Activity'),
        ('MESSAGE', 'New Message'),
        ('SYSTEM', 'System Alert'),
        ('SECURITY', 'Security Alert'),
        ('ADMIN', 'Admin Action'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='SYSTEM')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, default='')  # Frontend route to navigate to

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.username}"


class SystemSetting(models.Model):
    """Key-value configuration store for admin-toggleable settings."""
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(default='')
    description = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return f"{self.key} = {self.value}"

    @classmethod
    def get(cls, key, default=''):
        """Get a setting value by key."""
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set(cls, key, value, user=None, description=''):
        """Set a setting value."""
        obj, created = cls.objects.update_or_create(
            key=key,
            defaults={'value': str(value), 'updated_by': user, 'description': description}
        )
        return obj
