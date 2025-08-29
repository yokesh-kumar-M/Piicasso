from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.http import HttpResponse
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from django.shortcuts import redirect
import json
import csv

from .models import GenerationHistory, EmailVerification, UserProfile
from .email_utils import send_verification_email, send_password_reset_email

# Inline for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('email_verified', 'email_verified_at', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')

# Extended User Admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'email_verified_status', 'date_joined')
    list_filter = BaseUserAdmin.list_filter + ('profile__email_verified',)
    
    def email_verified_status(self, obj):
        try:
            profile = obj.profile
            if profile.email_verified:
                return format_html(
                    '<span style="color: green;">✓ Verified</span><br>'
                    '<small>{}</small>',
                    profile.email_verified_at.strftime('%Y-%m-%d %H:%M') if profile.email_verified_at else 'Unknown'
                )
            else:
                return format_html('<span style="color: red;">✗ Not Verified</span>')
        except UserProfile.DoesNotExist:
            return format_html('<span style="color: gray;">No Profile</span>')
    
    email_verified_status.short_description = 'Email Status'
    email_verified_status.admin_order_field = 'profile__email_verified'

    actions = ['send_verification_emails', 'mark_email_verified']

    def send_verification_emails(self, request, queryset):
        """Send verification emails to selected users"""
        sent_count = 0
        for user in queryset:
            try:
                profile, created = UserProfile.objects.get_or_create(user=user)
                if not profile.email_verified:
                    if send_verification_email(user):
                        sent_count += 1
            except Exception as e:
                self.message_user(request, f"Failed to send email to {user.username}: {str(e)}", level='ERROR')
        
        if sent_count > 0:
            self.message_user(request, f"Verification emails sent to {sent_count} users.")
        else:
            self.message_user(request, "No emails were sent.", level='WARNING')
    
    send_verification_emails.short_description = "Send verification emails to selected users"

    def mark_email_verified(self, request, queryset):
        """Manually mark email as verified for selected users"""
        count = 0
        for user in queryset:
            try:
                profile, created = UserProfile.objects.get_or_create(user=user)
                if not profile.email_verified:
                    profile.email_verified = True
                    profile.email_verified_at = timezone.now()
                    profile.save()
                    count += 1
            except Exception as e:
                self.message_user(request, f"Failed to verify {user.username}: {str(e)}", level='ERROR')
        
        if count > 0:
            self.message_user(request, f"Email verified for {count} users.")
        else:
            self.message_user(request, "No users were updated.", level='WARNING')
    
    mark_email_verified.short_description = "Mark email as verified for selected users"

# Re-register User admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'verification_type', 'token_preview', 'created_at', 'is_used', 'is_expired_status', 'time_remaining')
    list_filter = ('verification_type', 'is_used', 'created_at')
    search_fields = ('user__username', 'user__email', 'token')
    readonly_fields = ('token', 'created_at', 'is_expired_status', 'time_remaining')
    ordering = ('-created_at',)
    
    def token_preview(self, obj):
        """Show first 8 characters of token"""
        return f"{str(obj.token)[:8]}..."
    token_preview.short_description = 'Token Preview'
    
    def is_expired_status(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red;">✗ Expired</span>')
        else:
            return format_html('<span style="color: green;">✓ Valid</span>')
    is_expired_status.short_description = 'Status'
    
    def time_remaining(self, obj):
        if obj.is_expired:
            return "Expired"
        
        from datetime import timedelta
        if obj.verification_type == 'password_reset':
            expiry_hours = 1
        else:
            expiry_hours = 24
        
        expiry_time = obj.created_at + timedelta(hours=expiry_hours)
        remaining = expiry_time - timezone.now()
        
        if remaining.total_seconds() > 0:
            hours = int(remaining.total_seconds() // 3600)
            minutes = int((remaining.total_seconds() % 3600) // 60)
            return f"{hours}h {minutes}m remaining"
        else:
            return "Expired"
    
    time_remaining.short_description = 'Time Remaining'
    
    actions = ['mark_as_used', 'delete_expired_tokens']
    
    def mark_as_used(self, request, queryset):
        """Mark selected tokens as used"""
        count = queryset.update(is_used=True)
        self.message_user(request, f"Marked {count} tokens as used.")
    mark_as_used.short_description = "Mark selected tokens as used"
    
    def delete_expired_tokens(self, request, queryset):
        """Delete expired tokens"""
        expired_count = 0
        for token in queryset:
            if token.is_expired:
                token.delete()
                expired_count += 1
        
        self.message_user(request, f"Deleted {expired_count} expired tokens.")
    delete_expired_tokens.short_description = "Delete expired tokens"

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_verified', 'email_verified_at', 'created_at')
    list_filter = ('email_verified', 'created_at', 'email_verified_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    actions = ['verify_email', 'send_verification_email']
    
    def verify_email(self, request, queryset):
        """Manually verify email for selected profiles"""
        count = 0
        for profile in queryset:
            if not profile.email_verified:
                profile.email_verified = True
                profile.email_verified_at = timezone.now()
                profile.save()
                count += 1
        
        self.message_user(request, f"Verified email for {count} profiles.")
    verify_email.short_description = "Verify email for selected profiles"
    
    def send_verification_email(self, request, queryset):
        """Send verification email for selected profiles"""
        sent_count = 0
        for profile in queryset:
            if not profile.email_verified:
                try:
                    if send_verification_email(profile.user):
                        sent_count += 1
                except Exception as e:
                    self.message_user(request, f"Failed to send email to {profile.user.username}: {str(e)}", level='ERROR')
        
        self.message_user(request, f"Verification emails sent to {sent_count} users.")
    send_verification_email.short_description = "Send verification emails"

# Helper functions for GenerationHistory export
def export_wordlist(modeladmin, request, queryset):
    """Export selected wordlists"""
    if queryset.count() == 1:
        obj = queryset.first()
        response = HttpResponse("\n".join(obj.wordlist), content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename=wordlist_{obj.id}.txt'
        return response
    else:
        # Handle multiple selections
        import zipfile
        import io
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for obj in queryset:
                zip_file.writestr(f'wordlist_{obj.id}.txt', '\n'.join(obj.wordlist))
        
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=wordlists.zip'
        return response

def export_generation_data(modeladmin, request, queryset):
    """Export generation data as CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename=generation_data.csv'
    
    writer = csv.writer(response)
    writer.writerow([
        'ID', 'User', 'User Email', 'Email Verified', 'Timestamp', 'IP Address', 
        'PII Data', 'Wordlist Count', 'Sample Passwords'
    ])
    
    for obj in queryset:
        user_email = obj.user.email if obj.user else 'Anonymous'
        email_verified = 'Yes' if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.email_verified else 'No'
        sample = ', '.join((obj.wordlist or [])[:5]) + ('...' if obj.wordlist and len(obj.wordlist) > 5 else '')
        
        writer.writerow([
            obj.id,
            obj.user.username if obj.user else 'Anonymous',
            user_email,
            email_verified,
            obj.timestamp,
            obj.ip_address,
            json.dumps(obj.pii_data),
            len(obj.wordlist or []),
            sample
        ])
    
    return response

export_wordlist.short_description = "Download Selected Wordlists"
export_generation_data.short_description = "Export Generation Data (CSV)"

@admin.register(GenerationHistory)
class GenerationHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user_info", "timestamp", "ip_address", "short_pii", "wordlist_count", "wordlist_preview")
    list_filter = ("timestamp", "ip_address", "user__profile__email_verified")
    search_fields = ("user__username", "user__email", "ip_address")
    readonly_fields = ("timestamp", "pii_data", "wordlist", "ip_address", "user")
    actions = [export_wordlist, export_generation_data]
    ordering = ('-timestamp',)

    def user_info(self, obj):
        if obj.user:
            email_status = "✓" if hasattr(obj.user, 'profile') and obj.user.profile.email_verified else "✗"
            return format_html(
                '<strong>{}</strong><br>'
                '<small>{} {}</small>',
                obj.user.username,
                obj.user.email,
                format_html('<span style="color: {};">{}</span>', 'green' if email_status == "✓" else 'red', email_status)
            )
        return "Anonymous"
    user_info.short_description = "User"
    
    def short_pii(self, obj):
        """Show shortened PII data"""
        pii_str = json.dumps(obj.pii_data, indent=2)
        return (pii_str[:100] + "...") if len(pii_str) > 100 else pii_str
    short_pii.short_description = "PII Data"

    def wordlist_count(self, obj):
        """Show count of generated passwords"""
        return len(obj.wordlist) if obj.wordlist else 0
    wordlist_count.short_description = "Password Count"

    def wordlist_preview(self, obj):
        """Show preview of wordlist"""
        if not obj.wordlist:
            return "None"
        preview = "\n".join(obj.wordlist[:5])
        if len(obj.wordlist) > 5:
            preview += f"\n... and {len(obj.wordlist) - 5} more"
        return format_html(f"<pre style='max-width:300px; overflow-x:auto; font-size:12px;'>{preview}</pre>")
    wordlist_preview.short_description = "Password Preview"

# Admin site customization
admin.site.site_header = 'PIIcasso Administration'
admin.site.site_title = 'PIIcasso Admin'
admin.site.index_title = 'Welcome to PIIcasso Administration'