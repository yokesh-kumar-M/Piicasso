from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import string
import random

User = get_user_model()

class Squadron(models.Model):
    name = models.CharField(max_length=100)
    invite_code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_squadrons')

    def save(self, *args, **kwargs):
        if not self.invite_code:
            # Generate unique code
            while True:
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Squadron.objects.filter(invite_code=code).exists():
                    self.invite_code = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class SquadronMembership(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='squadron_membership')
    squadron = models.ForeignKey(Squadron, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, default='MEMBER', choices=[('LEADER', 'Leader'), ('MEMBER', 'Member')])
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.squadron.name}"
