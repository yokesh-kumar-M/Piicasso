from django.contrib import admin
from .models import UserActivity

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'description', 'city', 'timestamp', 'latitude', 'longitude')
    list_filter = ('activity_type', 'city')
    search_fields = ('description', 'city')
    ordering = ('-timestamp',)
