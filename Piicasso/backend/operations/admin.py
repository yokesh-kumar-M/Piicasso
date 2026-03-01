from django.contrib import admin
from .models import Message, SystemLog

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'timestamp', 'is_read')
    search_fields = ('sender__username', 'recipient__username', 'content')
    list_filter = ('is_read', 'timestamp')

@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'level', 'message', 'source')
    list_filter = ('level', 'source')
