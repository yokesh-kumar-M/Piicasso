from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

ADMIN_EMAIL = "yokeshkumar1704@gmail.com"
ADMIN_USERNAME = "Yokesh"
ADMIN_PASSWORD = "Thisisourteamproject"


class Command(BaseCommand):
    help = "Idempotent: create or update the system admin account."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={"username": ADMIN_USERNAME},
        )

        # Skip password reset for Google OAuth accounts
        if not created and not user.has_usable_password():
            self.stdout.write(self.style.WARNING(
                f"Admin {user.username} uses Google OAuth — password not changed."
            ))
        else:
            user.set_password(ADMIN_PASSWORD)

        user.username = ADMIN_USERNAME
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} admin account: {user.username} <{user.email}>"))
