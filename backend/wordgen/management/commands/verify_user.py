# backend/wordgen/management/commands/verify_user.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from wordgen.models import UserProfile

class Command(BaseCommand):
    help = 'Manually verify a user email (emergency override)'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email to verify')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email.lower())
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            if profile.email_verified:
                self.stdout.write(
                    self.style.WARNING(f'User {email} is already verified')
                )
                return
                
            profile.email_verified = True
            profile.email_verified_at = timezone.now()
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully verified email for user: {user.username} ({email})'
                )
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f' User with email {email} does not exist')
            )