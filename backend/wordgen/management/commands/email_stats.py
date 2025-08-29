# backend/wordgen/management/commands/email_stats.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from wordgen.models import UserProfile, EmailVerification

class Command(BaseCommand):
    help = 'Show email verification statistics'

    def handle(self, *args, **options):
        # Total users
        total_users = User.objects.count()
        
        # Verified users
        verified_users = UserProfile.objects.filter(email_verified=True).count()
        unverified_users = total_users - verified_users
        
        # Recent registrations (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(date_joined__gte=week_ago).count()
        recent_verified = User.objects.filter(
            date_joined__gte=week_ago,
            profile__email_verified=True
        ).count()
        
        # Token statistics
        active_tokens = EmailVerification.objects.filter(is_used=False)
        email_tokens = active_tokens.filter(verification_type='email_verify').count()
        password_tokens = active_tokens.filter(verification_type='password_reset').count()
        
        # Expired but unused tokens
        expired_tokens = 0
        for token in active_tokens:
            if token.is_expired:
                expired_tokens += 1
        
        self.stdout.write(self.style.SUCCESS('EMAIL VERIFICATION STATISTICS'))
        self.stdout.write('=' * 40)
        
        self.stdout.write(f'Total Users: {total_users}')
        self.stdout.write(f'Verified Users: {verified_users} ({verified_users/total_users*100:.1f}%)')
        self.stdout.write(f'Unverified Users: {unverified_users} ({unverified_users/total_users*100:.1f}%)')
        
        self.stdout.write('')
        self.stdout.write('RECENT ACTIVITY (Last 7 days)')
        self.stdout.write('-' * 30)
        self.stdout.write(f'New Registrations: {recent_users}')
        self.stdout.write(f'Recently Verified: {recent_verified}')
        if recent_users > 0:
            self.stdout.write(f'Verification Rate: {recent_verified/recent_users*100:.1f}%')
        
        self.stdout.write('')
        self.stdout.write('TOKEN STATISTICS')
        self.stdout.write('-' * 20)
        self.stdout.write(f'Active Email Verification Tokens: {email_tokens}')
        self.stdout.write(f'Active Password Reset Tokens: {password_tokens}')
        self.stdout.write(f'Expired (but unused) Tokens: {expired_tokens}')
        
        if expired_tokens > 0:
            self.stdout.write('')
            self.stdout.write(
                self.style.WARNING(
                    f'Consider running "python manage.py cleanup_tokens" to clean up {expired_tokens} expired tokens'
                )
            )