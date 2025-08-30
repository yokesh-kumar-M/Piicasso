import logging
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes

from .models import EmailVerification, UserProfile
from .serializers_auth import (
    UserRegistrationSerializer, 
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    CustomLoginSerializer,
    UserProfileSerializer
)
from .email_utils import send_verification_email, send_password_reset_email, send_welcome_email, resend_verification_email
from .decorators import rate_limit

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    """User registration with email verification"""
    permission_classes = [AllowAny]

    @rate_limit(key_prefix='register', limit=5, period=3600)  # 5 registrations per hour
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user (inactive until email verification)
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                is_active=True  # Keep active but check email verification in login
            )
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                email_verified=False
            )
            
            # Send verification email
            email_sent = send_verification_email(user, request)
            
            if email_sent:
                return Response({
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'email': user.email,
                    'email_sent': True
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Registration successful, but failed to send verification email. Please try resending.',
                    'email': user.email,
                    'email_sent': False
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            return Response(
                {'error': 'Registration failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyEmailView(APIView):
    """Email verification endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid verification data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification = serializer.verification
            user = verification.user
            
            # Mark email as verified
            profile = UserProfile.get_or_create_profile(user)
            profile.email_verified = True
            profile.email_verified_at = timezone.now()
            profile.save()
            
            # Mark verification token as used
            verification.mark_as_used()
            
            # Send welcome email
            send_welcome_email(user)
            
            logger.info(f"Email verified for user: {user.username}")
            
            return Response({
                'message': 'Email verified successfully! You can now log in.',
                'verified': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Email verification failed: {str(e)}")
            return Response(
                {'error': 'Verification failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    
    @rate_limit(key_prefix='resend_verification', limit=3, period=900)
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the new robust function
        success, message, user_email = send_verification_email_safe(email, request)
        
        if success:
            return Response({
                'message': message,
                'email_sent': True
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message,
                'email_sent': False
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    """Request password reset"""
    permission_classes = [AllowAny]
    
    @rate_limit(key_prefix='password_reset_request', limit=5, period=3600)  # 5 requests per hour
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Always return success for security (don't reveal if email exists)
        user = serializer.user
        if user:
            try:
                email_sent = send_password_reset_email(user, request)
                if email_sent:
                    logger.info(f"Password reset email sent to: {user.email}")
                else:
                    logger.error(f"Failed to send password reset email to: {user.email}")
            except Exception as e:
                logger.error(f"Password reset request failed: {str(e)}")
        
        return Response({
            'message': 'If an account with this email exists and is verified, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    """Confirm password reset with new password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification = serializer.verification
            user = verification.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            # Mark verification token as used
            verification.mark_as_used()
            
            # Invalidate all existing sessions/tokens for security
            refresh_tokens = RefreshToken.objects.filter(user=user)
            for token in refresh_tokens:
                try:
                    token.blacklist()
                except:
                    pass
            
            logger.info(f"Password reset successful for user: {user.username}")
            
            return Response({
                'message': 'Password reset successful! You can now log in with your new password.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset confirmation failed: {str(e)}")
            return Response(
                {'error': 'Password reset failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CustomLoginView(APIView):
    """Custom login view with email verification check"""
    permission_classes = [AllowAny]
    
    @rate_limit(key_prefix='login', limit=10, period=900)  # 10 attempts per 15 minutes
    def post(self, request):
        serializer = CustomLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Login failed', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save()
            
            logger.info(f"Successful login for user: {user.username}")
            
            return Response({
                'message': 'Login successful',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return Response(
                {'error': 'Login failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])
def check_verification_status(request, email):
    """Check if email is verified (for frontend use)"""
    try:
        user = User.objects.get(email=email.lower())
        profile = UserProfile.get_or_create_profile(user)
        
        return Response({
            'email': email,
            'verified': profile.email_verified,
            'exists': True
        })
        
    except User.DoesNotExist:
        return Response({
            'email': email,
            'verified': False,
            'exists': False
        })

@api_view(['GET'])
def user_profile(request):
    """Get current user profile"""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    profile = UserProfile.get_or_create_profile(request.user)
    serializer = UserProfileSerializer(profile)
    
    return Response(serializer.data)