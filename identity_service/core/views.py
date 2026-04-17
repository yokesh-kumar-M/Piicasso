import logging
import secrets
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)

# Google Client ID - ideally set in environment variables
GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_CLIENT_ID', None) or __import__('os').environ.get('GOOGLE_CLIENT_ID', '')

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        # Basic input validation
        if not username or not password:
            return Response(
                {'error': 'Missing required fields: username and password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(username) < 3 or len(username) > 30:
            return Response(
                {'error': 'Username must be 3-30 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return Response(
                {'error': 'Username may only contain letters, numbers, underscores, and hyphens.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return Response(
                {'error': 'Invalid email format.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response(
                {'error': e.messages[0] if e.messages else 'Password too weak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Registration failed. Username or email may already be in use.'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'Registration failed. Username or email may already be in use.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            logger.info(f"New user registered: {username}")
            return Response({'message': 'User created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({'error': 'Registration failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            # First try Firebase token as many React setups use Firebase Auth for Google
            firebase_project_id = getattr(settings, 'FIREBASE_PROJECT_ID', 'piicasso-d923a')
            try:
                payload = id_token.verify_firebase_token(
                    token,
                    google_requests.Request(),
                    audience=firebase_project_id,
                    clock_skew_in_seconds=60,
                )
            except ValueError:
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

            try:
                user = User.objects.get(email=email)
                if not user.is_active:
                    return Response(
                        {'error': 'Your account has been suspended.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                username = email.split('@')[0]
                while User.objects.filter(username=username).exists():
                    username = f"{username}{secrets.randbelow(900) + 100}"
                
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
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'is_superuser': user.is_superuser
            })
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid Google token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
