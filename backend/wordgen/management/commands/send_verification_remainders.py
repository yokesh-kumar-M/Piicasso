# backend/wordgen/management/commands/send_verification_reminders.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from wordgen.models import UserProfile, EmailVerification
from wordgen.email_utils import send_verification_email

class Command(BaseCommand):
    help = 'Send reminder emails to users who haven\'t verified their email addresses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=3,
            help='Send reminders to users registered more than this many days ago (default: 3)',
        )
        parser.add_argument(
            '--max-reminders',
            type=int,
            default=3,
            help='Maximum number of reminder emails to send per user (default: 3)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending emails',
        )

    def handle(self, *args, **options):
        days_old = options['days']
        max_reminders = options['max_reminders']
        dry_run = options['dry_run']
        
        # Find users who need verification reminders
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        unverified_users = User.objects.filter(
            date_joined__lt=cutoff_date,
            profile__email_verified=False
        )
        
        sent_count = 0
        skipped_count = 0
        
        for user in unverified_users:
            # Count how many verification emails we've already sent
            email_count = EmailVerification.objects.filter(
                user=user,
                verification_type='email_verify'
            ).count()
            
            if email_count >= max_reminders:
                skipped_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipping {user.username} - already sent {email_count} reminders'
                    )
                )
                continue
            
            if dry_run:
                self.stdout.write(
                    f'Would send reminder to {user.username} ({user.email}) - attempt #{email_count + 1}'
                )
                sent_count += 1
            else:
                try:
                    if send_verification_email(user):
                        sent_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Sent reminder to {user.username} ({user.email}) - attempt #{email_count + 1}'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Failed to send reminder to {user.username} ({user.email})'
                            )
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Error sending to {user.username}: {str(e)}'
                        )
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would send {sent_count} reminder emails'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Sent {sent_count} reminder emails, skipped {skipped_count} users'
                )
            )