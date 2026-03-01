from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import string
import random

User = get_user_model()

class Team(models.Model):
    name = models.CharField(max_length=100)
    invite_code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_teams')

    class Meta:
        indexes = [
            models.Index(fields=['invite_code']),
            models.Index(fields=['owner']),
        ]

    def save(self, *args, **kwargs):
        if not self.invite_code:
            # Generate unique code
            while True:
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Team.objects.filter(invite_code=code).exists():
                    self.invite_code = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class TeamMembership(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='team_membership')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, default='MEMBER', choices=[('LEADER', 'Leader'), ('MEMBER', 'Member')])
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['team', 'role']),
            models.Index(fields=['joined_at']),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.team.name}"


class TeamMessage(models.Model):
    """Chat messages scoped to a team. Only team members can read/write."""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='team_messages')
    content = models.TextField(max_length=2000)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['team', 'timestamp']),
        ]

    def __str__(self):
        return f"[{self.team.name}] {self.sender}: {self.content[:40]}"
