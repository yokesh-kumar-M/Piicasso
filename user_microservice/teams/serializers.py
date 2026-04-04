from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Team, TeamMembership, TeamMessage

class TeamSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Team
        fields = ['id', 'name', 'invite_code', 'member_count', 'owner_username', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()

class TeamMembershipSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'username', 'team', 'team_name', 'role', 'joined_at']

class TeamMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = TeamMessage
        fields = ['id', 'team', 'sender', 'sender_name', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']
