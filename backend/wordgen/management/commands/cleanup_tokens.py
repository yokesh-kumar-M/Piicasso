# backend/wordgen/management/commands/cleanup_tokens.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from wordgen.models import EmailVerification

class Command(BaseCommand):
    help = 'Clean up expired email verification and password reset tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Delete tokens older than this many days (default: 7)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days_old = options['days']
        
        # Calculate cutoff date
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        # Find expired tokens
        expired_tokens = EmailVerification.objects.filter(
            created_at__lt=cutoff_date
        )
        
        # Separate by type for better reporting
        email_verify_tokens = expired_tokens.filter(verification_type='email_verify')
        password_reset_tokens = expired_tokens.filter(verification_type='password_reset')
        
        total_count = expired_tokens.count()
        email_count = email_verify_tokens.count()
        password_count = password_reset_tokens.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {total_count} expired tokens:'
                )
            )
        else:
            self.stdout.write(
                f'Deleting {total_count} expired tokens older than {days_old} days...'
            )
        
        self.stdout.write(f'  - Email verification tokens: {email_count}')
        self.stdout.write(f'  - Password reset tokens: {password_count}')
        
        if not dry_run and total_count > 0:
            expired_tokens.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {total_count} expired tokens.'
                )
            )
        elif total_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired tokens found.')
            )