from django.contrib import admin
from .models import Message, SystemLog, Notification, SystemSetting

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'timestamp', 'is_read')
    search_fields = ('sender__username', 'recipient__username', 'content')
    list_filter = ('is_read', 'timestamp')

@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'level', 'message', 'source')
    list_filter = ('level', 'source')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'timestamp')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__username', 'title', 'description')

@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at', 'updated_by')
    search_fields = ('key', 'description')
