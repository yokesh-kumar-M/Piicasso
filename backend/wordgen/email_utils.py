import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import EmailVerification, UserProfile

logger = logging.getLogger(__name__)

def get_frontend_url():
    """Get the frontend URL from settings"""
    return getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

def send_verification_email(user, request=None):
    """Send email verification email"""
    try:
        # Clean up old unused verification tokens
        EmailVerification.objects.filter(
            user=user, 
            verification_type='email_verify',
            is_used=False
        ).delete()
        
        # Create new verification token
        verification = EmailVerification.objects.create(
            user=user,
            verification_type='email_verify'
        )
        
        # Build verification URL
        frontend_url = get_frontend_url()
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
        
        if result == 1:
            logger.info(f"Verification email sent to {user.email}")
            return True
        else:
            logger.error(f"Failed to send verification email to {user.email}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False

def send_welcome_email(user):
    """Send welcome email after successful verification"""
    try:
        frontend_url = get_frontend_url()
        login_url = f"{frontend_url}/login"
        
        context = {
            'user': user,
            'login_url': login_url,
            'site_name': 'PIIcasso',
        }
        
        subject = 'Welcome to PIIcasso!'
        html_message = render_to_string('emails/welcome.html', context)
        plain_message = render_to_string('emails/welcome.txt', context)
        
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        if result == 1:
            logger.info(f"Welcome email sent to {user.email}")
            return True
        else:
            logger.error(f"Failed to send welcome email to {user.email}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False

def send_password_reset_email(user, request=None):
    """Send password reset email"""
    try:
        # Clean up old unused reset tokens
        EmailVerification.objects.filter(
            user=user, 
            verification_type='password_reset',
            is_used=False
        ).delete()
        
        # Create new reset token
        verification = EmailVerification.objects.create(
            user=user,
            verification_type='password_reset'
        )
        
        # Build reset URL
        frontend_url = get_frontend_url()
        reset_url = f"{frontend_url}/reset-password/{verification.token}"
        
        # Email context
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': 'PIIcasso',
            'token': verification.token,
        }
        
        # Render email content
        subject = 'PIIcasso - Password Reset Request'
        html_message = render_to_string('emails/password_reset.html', context)
        plain_message = render_to_string('emails/password_reset.txt', context)
        
        # Send email
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        if result == 1:
            logger.info(f"Password reset email sent to {user.email}")
            return True
        else:
            logger.error(f"Failed to send password reset email to {user.email}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False

def resend_verification_email(user):
    """Resend verification email"""
    profile = UserProfile.get_or_create_profile(user)
    
    if profile.email_verified:
        return False, "Email is already verified."
    
    success = send_verification_email(user)
    
    if success:
        return True, "Verification email sent successfully."
    else:
        return False, "Failed to send verification email."