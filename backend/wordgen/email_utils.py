# backend/wordgen/email_utils.py
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from .models import EmailVerification, UserProfile

logger = logging.getLogger(__name__)

def get_user_by_email_or_user(identifier):
    """
    Safely get user by email string or User object
    Returns: (User|None, error_message)
    """
    if isinstance(identifier, User):
        return identifier, None
    
    if isinstance(identifier, str):
        try:
            user = User.objects.get(email=identifier.lower())
            return user, None
        except User.DoesNotExist:
            # Don't reveal if email exists - security measure
            return None, "If an account with this email exists, a verification email will be sent"
        except User.MultipleObjectsReturned:
            logger.warning(f"Multiple users found for email: {identifier}")
            return None, "Multiple accounts found. Please contact support"
    
    return None, "Invalid user identifier"

def send_verification_email_safe(user_or_email, request=None):
    """
    Robust verification email sender with rate limiting
    Returns: (success: bool, message: str, user_email: str|None)
    """
    
    # Step 1: Get user safely
    user, error = get_user_by_email_or_user(user_or_email)
    if not user:
        # For security, always return success-like message
        return True, "If an account with this email exists, a verification email will be sent", None
    
    # Step 2: Get or create profile
    try:
        profile = UserProfile.get_or_create_profile(user)
    except Exception as e:
        logger.error(f"Failed to get profile for user {user.username}: {str(e)}")
        return False, "Profile creation failed. Please try again", user.email
    
    # Step 3: Check if already verified
    if profile.email_verified:
        return False, "Email is already verified", user.email
    
    # Step 4: Check rate limiting
    can_send, rate_message = profile.can_send_verification_email()
    if not can_send:
        logger.info(f"Rate limit hit for user {user.username}: {rate_message}")
        return False, rate_message, user.email
    
    # Step 5: Send email
    try:
        success = _send_verification_email_internal(user, request)
        
        if success:
            # Record successful send
            profile.record_verification_email_sent()
            logger.info(f"Verification email sent to {user.email}")
            return True, "Verification email sent successfully", user.email
        else:
            logger.error(f"Failed to send verification email to {user.email}")
            return False, "Failed to send email. Please try again", user.email
            
    except Exception as e:
        logger.error(f"Exception sending verification email to {user.email}: {str(e)}")
        return False, "Email service temporarily unavailable", user.email

def _send_verification_email_internal(user, request=None):
    """Internal email sending logic"""
    try:
        # Clean up old unused verification tokens (don't delete, mark expired)
        old_tokens = EmailVerification.objects.filter(
            user=user, 
            verification_type='email_verify',
            is_used=False
        )
        
        # Mark old tokens as expired instead of deleting
        for token in old_tokens:
            if not token.is_expired:
                token.is_used = True  # Mark as used to prevent reuse
                token.save()
        
        # Create new verification token
        verification = EmailVerification.objects.create(
            user=user,
            verification_type='email_verify'
        )
        
        # Build verification URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/verify-email/{verification.token}"
        
        # Email context
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'PIIcasso',
            'token': verification.token,
        }
        
        # Render email content
        subject = 'PIIcasso - Verify Your Email Address'
        html_message = render_to_string('emails/email_verification.html', context)
        plain_message = render_to_string('emails/email_verification.txt', context)
        
        # Send email
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return result == 1
        
    except Exception as e:
        logger.error(f"Internal email send failed for {user.email}: {str(e)}")
        return False

# Backward compatibility
def resend_verification_email(user_or_email):
    """Legacy function for backward compatibility"""
    success, message, email = send_verification_email_safe(user_or_email)
    return success, message

def send_verification_email(user, request=None):
    """Legacy function for backward compatibility"""
    success, message, email = send_verification_email_safe(user, request)
    return success

def send_password_reset_email(user, request=None):
    """Send a password reset email. Returns True on success, False on failure."""
    try:
        # Mark any old unused password-reset tokens as used to prevent reuse
        old_tokens = EmailVerification.objects.filter(
            user=user,
            verification_type='password_reset',
            is_used=False
        )
        for token in old_tokens:
            if not token.is_expired:
                token.is_used = True
                token.save()

        # Create a new password-reset token
        verification = EmailVerification.objects.create(
            user=user,
            verification_type='password_reset'
        )

        # Build reset URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password/{verification.token}"

        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'PIIcasso',
            'token': verification.token,
        }

        subject = 'PIIcasso - Reset Your Password'
        html_message = render_to_string('emails/password_reset.html', context)
        plain_message = render_to_string('emails/password_reset.txt', context)

        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        return result == 1

    except Exception as e:
        logger.error(f"Password reset email failed for {getattr(user, 'email', None)}: {e}")
        return False