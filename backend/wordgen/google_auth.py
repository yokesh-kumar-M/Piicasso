# backend/wordgen/google_auth.py
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth.models import User
from django.conf import settings
from .models import UserProfile

class GoogleOAuth:
    @staticmethod
    def verify_google_token(token):
        """
        Verify Google OAuth token and return user info
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            # Check if token is from correct audience
            if idinfo['aud'] != settings.GOOGLE_OAUTH2_CLIENT_ID:
                raise ValueError('Wrong audience.')
            
            return {
                'email': idinfo['email'],
                'email_verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name', ''),
                'given_name': idinfo.get('given_name', ''),
                'family_name': idinfo.get('family_name', ''),
                'picture': idinfo.get('picture', ''),
                'google_id': idinfo['sub']
            }
            
        except ValueError as e:
            # Invalid token
            return None
    
    @staticmethod
    def get_or_create_user(google_user_info):
        """
        Get or create user from Google OAuth info
        """
        email = google_user_info['email']
        google_id = google_user_info['google_id']
        
        # Try to find user by email first
        try:
            user = User.objects.get(email=email)
            
            # Update user info if found
            if not user.first_name and google_user_info.get('given_name'):
                user.first_name = google_user_info['given_name']
            if not user.last_name and google_user_info.get('family_name'):
                user.last_name = google_user_info['family_name']
            user.save()
            
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            
            # Make username unique if it already exists
            original_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=google_user_info.get('given_name', ''),
                last_name=google_user_info.get('family_name', ''),
            )
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # If email is verified by Google, mark as verified
        if google_user_info.get('email_verified', False):
            profile.email_verified = True
            if not profile.email_verified_at:
                from django.utils import timezone
                profile.email_verified_at = timezone.now()
            profile.save()
        
        return user, profile

# backend/wordgen/views_auth.py - Add this to your existing views_auth.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .google_auth import GoogleOAuth
from .decorators import rate_limit

class GoogleOAuthView(APIView):
    """Google OAuth authentication endpoint"""
    permission_classes = [AllowAny]
    
    @rate_limit(key_prefix='google_oauth', limit=10, period=3600)  # 10 attempts per hour
    def post(self, request):
        google_token = request.data.get('token')
        
        if not google_token:
            return Response(
                {'error': 'Google token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify Google token
            google_user_info = GoogleOAuth.verify_google_token(google_token)
            
            if not google_user_info:
                return Response(
                    {'error': 'Invalid Google token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user
            user, profile = GoogleOAuth.get_or_create_user(google_user_info)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            from django.utils import timezone
            user.last_login = timezone.now()
            user.save()
            
            logger.info(f"Google OAuth successful for user: {user.username}")
            
            return Response({
                'message': 'Google authentication successful',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'email_verified': profile.email_verified,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Google OAuth failed: {str(e)}")
            return Response(
                {'error': 'Google authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# backend/wordgen/urls.py - Add this to your existing URLs
from .views_auth import GoogleOAuthView

urlpatterns = [
    # ... existing URLs
    path('auth/google/', GoogleOAuthView.as_view(), name='google_oauth'),
    # ... rest of URLs
]

# backend/backend/settings.py - Add these settings
import os

# Google OAuth2 Settings
GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')

if not GOOGLE_OAUTH2_CLIENT_ID:
    print("Warning: GOOGLE_OAUTH2_CLIENT_ID not set. Google OAuth will not work.")

# Updated requirements.txt
"""
Add these lines to your requirements.txt:

google-auth==2.23.4
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.1.1
"""