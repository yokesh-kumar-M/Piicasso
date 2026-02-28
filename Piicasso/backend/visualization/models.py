from django.db import models
import random

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('LOGIN', 'User Login'),
        ('GENERATE', 'Wordlist Generated'),
        ('SCAN', 'Network Scan'),
        ('BREACH', 'Data Breach Detected'),
        ('SQUAD_JOIN', 'Squadron Joined')
    ]

    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Geo Data for the Globe
    latitude = models.FloatField()
    longitude = models.FloatField()
    country_code = models.CharField(max_length=3, default='UNK')
    city = models.CharField(max_length=100, default='Unknown')
    
    # Visual cues for the globe
    color = models.CharField(max_length=20, default='green') # hex or color name
    intensity = models.FloatField(default=0.5) # 0.0 to 1.0 (size on globe)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
        ]

    def save(self, *args, **kwargs):
        # Simulate geo-location if not provided (Microservice Pattern: Enrichment)
        if self.latitude is None or self.longitude is None:
            self.latitude = 999.0
            self.longitude = 999.0
            
            # Simple color logic based on activity
            if self.activity_type == 'BREACH':
                self.color = '#ef4444' # red-500
                self.intensity = 1.0
            elif self.activity_type == 'GENERATE':
                self.color = '#eab308' # yellow-500
                self.intensity = 0.7
            elif self.activity_type == 'LOGIN':
                self.color = '#22c55e' # green-500
                self.intensity = 0.4
            elif self.activity_type == 'SCAN':
                self.color = '#3b82f6' # blue-500
                self.intensity = 0.6

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.activity_type} at {self.city} ({self.latitude}, {self.longitude})"
