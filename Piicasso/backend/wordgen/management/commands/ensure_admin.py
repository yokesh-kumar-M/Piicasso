"""
Idempotently ensure a superuser exists, using credentials supplied ONLY via
environment variables. No credentials are ever hardcoded in source.

Required env vars (the command no-ops with a warning if any are missing, so it
is safe to call unconditionally from a deploy script):

    DJANGO_SUPERUSER_USERNAME
    DJANGO_SUPERUSER_EMAIL
    DJANGO_SUPERUSER_PASSWORD

Usage:
    python manage.py ensure_admin
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Ensure a superuser exists using DJANGO_SUPERUSER_* environment variables."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")

        if not (username and email and password):
            self.stdout.write(
                self.style.WARNING(
                    "ensure_admin: DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD "
                    "not all set — skipping admin bootstrap."
                )
            )
            return

        # Match on email first (the stable identity), then fall back to username.
        user = (
            User.objects.filter(email__iexact=email).first()
            or User.objects.filter(username=username).first()
        )
        created = user is None
        if created:
            user = User(username=username, email=email)

        user.username = username
        user.email = email
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} admin account: {user.username} <{user.email}>")
        )
