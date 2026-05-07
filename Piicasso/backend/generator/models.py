from django.db import models
from django.contrib.auth import get_user_model

from .fields import EncryptedJSONField

User = get_user_model()

class GenerationHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    pii_data = EncryptedJSONField()  # Fernet-encrypted at rest; never stored as plaintext
    wordlist = models.JSONField()
    wordlist_count = models.PositiveIntegerField(default=0, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['wordlist_count']),
        ]

    def save(self, *args, **kwargs):
        if self.wordlist:
            self.wordlist_count = len(self.wordlist)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Generated @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
