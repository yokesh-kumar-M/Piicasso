from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import uuid
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class GenerationHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    pii_data = models.JSONField()
    wordlist = models.JSONField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]

    def clean(self):
        if not self.wordlist or len(self.wordlist) == 0:
            raise ValidationError("Wordlist cannot be empty")
        
        if len(self.wordlist) > 1000:
            raise ValidationError("Wordlist too large")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Generated @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    verification_type = models.CharField(
        max_length=20,
        choices=[
            ('email_verify', 'Email Verification'),
            ('password_reset', 'Password Reset'),
        ],
        default='email_verify'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'verification_type']),
        ]

    @property
    def is_expired(self):
        """Check if token is expired (24 hours for email verify, 1 hour for password reset)"""
        if self.verification_type == 'password_reset':
            expiry_hours = 1
        else:
            expiry_hours = 24
        
        expiry_time = self.created_at + timedelta(hours=expiry_hours)
        return timezone.now() > expiry_time

    @property
    def is_valid(self):
        """Check if token is valid (not used and not expired)"""
        return not self.is_used and not self.is_expired

    def mark_as_used(self):
        """Mark token as used"""
        self.is_used = True
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.verification_type} - {self.token}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Rate limiting fields
    last_verification_sent = models.DateTimeField(null=True, blank=True)
    verification_email_count = models.PositiveIntegerField(default=0)
    verification_cooldown_until = models.DateTimeField(null=True, blank=True)

    def can_send_verification_email(self):
        """Check if user can receive another verification email"""
        now = timezone.now()
        
        # Check cooldown period
        if self.verification_cooldown_until and now < self.verification_cooldown_until:
            remaining = (self.verification_cooldown_until - now).total_seconds()
            return False, f"Please wait {int(remaining // 60)} minutes before requesting another email"
        
        # Check daily limit (max 5 per day)
        if self.last_verification_sent:
            if (now - self.last_verification_sent) < timedelta(hours=24):
                if self.verification_email_count >= 5:
                    return False, "Daily email limit reached. Please try again tomorrow"
            else:
                # Reset daily counter
                self.verification_email_count = 0
        
        return True, "OK"
    
    def record_verification_email_sent(self):
        """Record that a verification email was sent"""
        now = timezone.now()
        
        # Reset counter if it's a new day
        if not self.last_verification_sent or (now - self.last_verification_sent) >= timedelta(hours=24):
            self.verification_email_count = 0
        
        self.verification_email_count += 1
        self.last_verification_sent = now
        
        # Set cooldown (5 minutes for first 2 emails, 15 minutes after that)
        if self.verification_email_count <= 2:
            cooldown_minutes = 5
        else:
            cooldown_minutes = 15
            
        self.verification_cooldown_until = now + timedelta(minutes=cooldown_minutes)
        self.save()

    @classmethod
    def get_or_create_profile(cls, user):
        profile, created = cls.objects.get_or_create(user=user)
        return profile