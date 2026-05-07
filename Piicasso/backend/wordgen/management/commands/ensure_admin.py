from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

ADMIN_EMAIL = "yokeshkumar1704@gmail.com"
ADMIN_USERNAME = "Yokesh"
ADMIN_PASSWORD = "Thisisourteamproject"

def handle(self, *args, **options):
    from django.utils import timezone
    # Normalize email to lowercase
    admin_email = ADMIN_EMAIL.lower()
    user, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            "username": ADMIN_USERNAME,
            "last_login": timezone.now()
        },
    )

    # Always ensure admin privileges
    user.email = admin_email
    user.username = ADMIN_USERNAME
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.set_password(ADMIN_PASSWORD)
    user.save()

    verb = "Created" if created else "Updated"
    self.stdout.write(self.style.SUCCESS(f"{verb} admin account: {user.username} <{user.email}>"))
