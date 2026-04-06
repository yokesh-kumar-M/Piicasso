from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserPreference(models.Model):
    MODE_CHOICES = [
        ('user', 'User Mode'),
        ('security', 'Security Mode'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preference')
    default_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='user')
    last_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='user')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Preference'
        verbose_name_plural = 'User Preferences'

    def __str__(self):
        return f"{self.user.username} - {self.default_mode}"


class PasswordAnalysis(models.Model):
    VULNERABILITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_analyses')
    pii_data = models.JSONField(default=dict, blank=True)
    password_hash = models.CharField(max_length=128)
    vulnerability_level = models.CharField(max_length=20, choices=VULNERABILITY_LEVELS)
    strength_score = models.PositiveIntegerField(default=0)
    crack_time_estimate = models.CharField(max_length=100, blank=True)
    breach_count = models.PositiveIntegerField(default=0)
    recommendations = models.JSONField(default=list, blank=True)
    vulnerabilities_found = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password Analysis'
        verbose_name_plural = 'Password Analyses'

    def __str__(self):
        return f"{self.user.username} - {self.vulnerability_level} - {self.created_at}"


class PasswordAuditLog(models.Model):
    ACTION_TYPES = [
        ('analyze', 'Password Analysis'),
        ('breach_check', 'Breach Check'),
        ('view_history', 'View History'),
        ('export', 'Export Data'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Password Audit Log'
        verbose_name_plural = 'Password Audit Logs'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"
