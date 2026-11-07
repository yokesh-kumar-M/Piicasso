import hashlib
import hmac
import logging
import secrets
import string

import requests as _requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
logger = logging.getLogger("cerberus.auth")

try:
    from google.auth.transport import requests as _google_requests

    _google_session = _google_requests.Request(session=_requests.Session())
except Exception:
    _google_session = None


class AuthService:
    @staticmethod
    def generate_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        refresh["username"] = user.username
        refresh["is_superuser"] = user.is_superuser
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "is_superuser": user.is_superuser,
        }

    @staticmethod
    def register_user(username, email, password):
        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError({"error": "A user with this username already exists."})
        if email and User.objects.filter(email__iexact=email).exists():
            raise ValidationError({"error": "A user with this email already exists."})

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        return user

    @staticmethod
    def verify_google_token(id_token_str):
        from google.oauth2 import id_token

        google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        if not google_client_id:
            raise AuthenticationFailed("Google OAuth is not configured on the server.")

        try:
            id_info = id_token.verify_oauth2_token(id_token_str, _google_session, google_client_id)
        except ValueError as exc:
            raise AuthenticationFailed(f"Invalid Google token: {exc}")

        email = id_info.get("email")
        if not email:
            raise AuthenticationFailed("Google token does not contain an email address.")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            while User.objects.filter(username__iexact=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
            )
            user.set_unusable_password()
            user.save()

        return user

    @staticmethod
    def request_password_reset(email):
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return False

        otp = "".join(secrets.choice(string.digits) for _ in range(6))
        cache_key = f"cerberus:pw_reset_otp:{email.lower()}"
        cache.set(cache_key, otp, timeout=600)  # 10 minutes

        try:
            send_mail(
                subject="PIIcasso Password Reset Verification Code",
                message=f"Your verification code is: {otp}\n\nThis code will expire in 10 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error("Failed to dispatch password reset email: %s", e)

        return True

    @staticmethod
    def verify_otp_and_reset_password(email, otp, new_password):
        cache_key = f"cerberus:pw_reset_otp:{email.lower()}"
        cached_otp = cache.get(cache_key)

        if not cached_otp or not hmac.compare_digest(str(cached_otp), str(otp)):
            raise ValidationError({"error": "Invalid or expired verification code."})

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise ValidationError({"error": "User account not found."})

        user.set_password(new_password)
        user.save()
        cache.delete(cache_key)
        return True

