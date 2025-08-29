import os
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
from .models import EmailVerification

logger = logging.getLogger(__name__)

def get_frontend_url():
    """Get frontend URL from settings or environment"""
    return os.getenv('FRONTEND_URL', 'http://localhost:3000')

def send_verification_email(user, request=None):
    """Send email verification email to user"""
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
        
        logger.info(f"Verification email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False

def send_password_reset_email(user, request=None):
    """Send password reset email to user"""
    try:
        # Clean up old unused password reset tokens
        EmailVerification.objects.filter(
            user=user,
            verification_type='password_reset',
            is_used=False
        ).delete()
        
        # Create new password reset token
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
        
        logger.info(f"Password reset email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False

def send_welcome_email(user):
    """Send welcome email after successful verification"""
    try:
        context = {
            'user': user,
            'site_name': 'PIIcasso',
            'login_url': f"{get_frontend_url()}/login",
        }
        
        subject = 'Welcome to PIIcasso - Account Verified!'
        html_message = render_to_string('emails/welcome.html', context)
        plain_message = render_to_string('emails/welcome.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Welcome emails are nice-to-have
        )
        
        logger.info(f"Welcome email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False

def resend_verification_email(user):
    """Resend verification email (with rate limiting check)"""
    from django.utils import timezone
    from datetime import timedelta
    
    # Check if we recently sent an email (rate limiting)
    recent_verification = EmailVerification.objects.filter(
        user=user,
        verification_type='email_verify',
        created_at__gte=timezone.now() - timedelta(minutes=5)
    ).first()
    
    if recent_verification:
        return False, "Please wait 5 minutes before requesting another verification email."
    
    success = send_verification_email(user)
    if success:
        return True, "Verification email sent successfully."
    else:
        return False, "Failed to send verification email. Please try again."