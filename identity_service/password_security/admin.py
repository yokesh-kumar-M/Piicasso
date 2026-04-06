from django.contrib import admin
from .models import PasswordAnalysis, UserPreference, PasswordAuditLog


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'default_mode', 'last_mode', 'updated_at']
    list_filter = ['default_mode', 'last_mode']
    search_fields = ['user__username', 'user__email']
    ordering = ['-updated_at']


@admin.register(PasswordAnalysis)
class PasswordAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'vulnerability_level', 'strength_score', 'breach_count', 'created_at']
    list_filter = ['vulnerability_level', 'created_at']
    search_fields = ['user__username', 'password_hash']
    ordering = ['-created_at']
    readonly_fields = ['user', 'pii_data', 'password_hash', 'vulnerability_level', 
                      'strength_score', 'crack_time_estimate', 'breach_count',
                      'recommendations', 'vulnerabilities_found', 'created_at']


@admin.register(PasswordAuditLog)
class PasswordAuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'action', 'ip_address', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'ip_address']
    ordering = ['-timestamp']
    readonly_fields = ['user', 'action', 'ip_address', 'user_agent', 'details', 'timestamp']
