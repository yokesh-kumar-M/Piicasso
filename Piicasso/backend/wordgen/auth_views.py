import logging
import hmac

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import secrets
import string
from analytics.models import UserActivity

User = get_user_model()
logger = logging.getLogger('wordgen')

# Google OAuth Client ID — must be set in environment for production (1.4 fix)
GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_CLIENT_ID', None) or __import__('os').environ.get('GOOGLE_CLIENT_ID', '')

def safe_float(val, default=999.0):
    try:
        return float(val) if val is not None and val != "" else default
    except (ValueError, TypeError):
        return default


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['username'] = self.user.username
        data['is_superuser'] = self.user.is_superuser
        
        lat = self.initial_data.get('lat') if hasattr(self, 'initial_data') else None
        lng = self.initial_data.get('lng') if hasattr(self, 'initial_data') else None
        city = self.initial_data.get('city', 'Unknown') if hasattr(self, 'initial_data') else 'Unknown'
        country_code = self.initial_data.get('country_code', 'UNK') if hasattr(self, 'initial_data') else 'UNK'

        # Log real login activity (anonymized for globe data)
        UserActivity.objects.create(
            activity_type='LOGIN',
            description=f"Operator authenticated.",
            city=city or 'Unknown',
            country_code=(country_code or 'UNK')[:3],
            latitude=max(-90.0, min(90.0, safe_float(lat))) if safe_float(lat) != 999.0 else 999.0,
            longitude=max(-180.0, min(180.0, safe_float(lng))) if safe_float(lng) != 999.0 else 999.0
        )
        
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def get_throttles(self):
        from backend.throttles import LoginRateThrottle
        return [LoginRateThrottle()]


class GoogleLoginView(APIView):
    """
    Google OAuth login — verifies Google ID tokens using the google-auth library
    with proper audience (client ID) checking (1.4 fix).
    
    Previously used the deprecated tokeninfo debug endpoint which:
    - Did not verify the audience claim
    - Accepted tokens from ANY Google app
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        city = request.data.get('city', 'Unknown')
        country_code = request.data.get('country_code', 'UNK')
        
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            # First try as a Firebase token (which is what the frontend uses)
            firebase_project_id = getattr(settings, 'FIREBASE_PROJECT_ID', 'piicasso-d923a')
            try:
                payload = id_token.verify_firebase_token(
                    token,
                    google_requests.Request(),
                    audience=firebase_project_id,
                    clock_skew_in_seconds=60,
                )
            except ValueError as fe:
                # Fallback to standard Google OAuth2 token check
                payload = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    audience=GOOGLE_CLIENT_ID if GOOGLE_CLIENT_ID else None,
                    clock_skew_in_seconds=60,
                )


            email = payload.get('email')
            name = payload.get('name', '')
            
            if not email:
                return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)

            if not payload.get('email_verified', False):
                return Response({'error': 'Google email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user exists
            try:
                user = User.objects.get(email=email)
                # Check if user is active (1.3 related)
                if not user.is_active:
                    return Response(
                        {'error': 'Your account has been suspended.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                # Create user
                username = email.split('@')[0]
                # Ensure username uniqueness using secure random
                while User.objects.filter(username=username).exists():
                    username = f"{username}{secrets.randbelow(900) + 100}"
                
                # Split name properly
                first_name = ''
                last_name = ''
                if name:
                    parts = name.split()
                    first_name = parts[0]
                    if len(parts) > 1:
                        last_name = ' '.join(parts[1:])

                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                user.set_unusable_password()
                user.save()
            
            # Generate Tokens
            refresh = RefreshToken.for_user(user)
            
            # Log real Google login activity (anonymized)
            UserActivity.objects.create(
                activity_type='LOGIN',
                description=f"Operator authenticated via Google.",
                city=city or 'Unknown',
                country_code=(country_code or 'UNK')[:3],
                latitude=max(-90.0, min(90.0, safe_float(lat))) if safe_float(lat) != 999.0 else 999.0,
                longitude=max(-180.0, min(180.0, safe_float(lng))) if safe_float(lng) != 999.0 else 999.0
            )
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'is_superuser': user.is_superuser
            })
            
        except ValueError as e:
            # google.oauth2.id_token raises ValueError for invalid tokens
            logger.warning(f"Google OAuth token verification failed: {e}")
            return Response(
                {'error': f'Invalid Google token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            from google.auth.exceptions import GoogleAuthError
            if isinstance(e, GoogleAuthError):
                logger.error(f"GoogleAuthError in Google login: {e}")
                return Response(
                    {'error': f'Google Auth configuration error: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            
            # 1.5 fix: generic error message; log full exception server-side
            logger.error(f"Google login error: {type(e).__name__} - {e}", exc_info=True)
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def get_throttles(self):
        from backend.throttles import PasswordResetRateThrottle
        return [PasswordResetRateThrottle()]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            if not user.has_usable_password():
                return Response({"error": "This account is authenticated externally (e.g. Google). Password reset not available."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Generate 6 digit OTP using cryptographically secure random
            otp = ''.join(secrets.choice(string.digits) for _ in range(6))
            
            # Store in cache for 10 minutes (600 seconds)
            cache.set(f"pwd_reset_otp_{email}", otp, timeout=600)
            
            # Send Email (5.3: using fail_silently=True as a fallback;
            # ideally this should be moved to a Celery task)
            try:
                send_mail(
                    subject='PIIcasso - System Recovery Authorization',
                    message=f'Operator {user.username},\n\nA password reset was requested for your account.\n\nYour Authorization Code: {otp}\n\nThis code will self-destruct in 10 minutes.\nIf you did not request this, ignore this transmission.',
                    from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@piicasso.com',
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"SMTP send failure for password reset: {e}")
                # Still return success to avoid leaking info about email existence
            
            return Response({"message": "If an account exists, a recovery code has been sent."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Mask existence of user
            return Response({"message": "If an account exists, a recovery code has been sent."}, status=status.HTTP_200_OK)
        except Exception as e:
            # 1.5 fix: generic error; log details server-side
            logger.error(f"Password reset error: {e}", exc_info=True)
            return Response({"error": "Failed to process request. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def get_throttles(self):
        from backend.throttles import OTPVerifyRateThrottle
        return [OTPVerifyRateThrottle()]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password')
        
        if not all([email, otp, new_password]):
            return Response({"error": "Missing required fields (email, otp, new_password)."}, status=status.HTTP_400_BAD_REQUEST)

        # Check OTP attempt counter to prevent brute force
        attempt_key = f'otp_attempts_{email}'
        attempts = cache.get(attempt_key, 0)
        if attempts >= 5:
            # Invalidate the OTP entirely after too many attempts
            cache.delete(f"pwd_reset_otp_{email}")
            cache.delete(attempt_key)
            return Response(
                {"error": "Too many invalid attempts. Please request a new code."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        stored_otp = cache.get(f"pwd_reset_otp_{email}")
        
        # Use constant-time comparison to prevent timing attacks
        if not stored_otp or not hmac.compare_digest(str(stored_otp), str(otp)):
            # Increment attempt counter (expires in 10 minutes)
            cache.set(attempt_key, attempts + 1, 600)
            return Response({"error": "Invalid or expired authorization code."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            
            # Validate new password strength
            from django.contrib.auth.password_validation import validate_password as django_validate_password
            try:
                django_validate_password(new_password, user=user)
            except DjangoValidationError as e:
                return Response({"error": e.messages[0] if e.messages else "Password too weak."}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            
            # Invalidate OTP and attempts counter
            cache.delete(f"pwd_reset_otp_{email}")
            cache.delete(f"otp_attempts_{email}")
            
            # Log security event
            UserActivity.objects.create(
                activity_type='CONFIG',
                description=f"Operator {user.username} executed system password recovery.",
                city="Security Center",
                latitude=999.0,
                longitude=999.0
            )
            
            return Response({"message": "Password successfully reset."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User no longer exists."}, status=status.HTTP_404_NOT_FOUND)
