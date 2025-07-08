from django.db import models

class GenerationHistory(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    pii_data = models.JSONField()
    wordlist = models.JSONField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"Generated @ {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
