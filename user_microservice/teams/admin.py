from django.contrib import admin
from .models import Team, TeamMembership, TeamMessage

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'invite_code', 'owner', 'created_at')
    search_fields = ('name', 'invite_code', 'owner__username')

@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'team__name')

@admin.register(TeamMessage)
class TeamMessageAdmin(admin.ModelAdmin):
    list_display = ('team', 'sender', 'timestamp')
    list_filter = ('team',)
    search_fields = ('sender__username', 'content')
    ordering = ('-timestamp',)
