# Add to your existing email_utils.py

import logging
from django.core.mail import send_mail
from django.conf import settings
import smtplib
import socket

logger = logging.getLogger(__name__)

def send_verification_email_with_fallback(user, request=None):
    """Enhanced email sending with better error handling and logging"""
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
        
        # Send email with enhanced error handling
        try:
            result = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            if result == 1:  # Success
                logger.info(f"Verification email sent successfully to {user.email}")
                return True, "Email sent successfully"
            else:
                logger.error(f"Email send failed (no exception) to {user.email}")
                return False, "Email service returned failure"
                
        except smtplib.SMTPAuthenticationError:
            logger.error(f"SMTP Authentication failed for {user.email}")
            return False, "Email service authentication failed"
            
        except smtplib.SMTPRecipientsRefused:
            logger.error(f"Recipient email refused: {user.email}")
            return False, "Email address rejected by server"
            
        except smtplib.SMTPServerDisconnected:
            logger.error(f"SMTP server disconnected for {user.email}")
            return False, "Email server connection lost"
            
        except socket.gaierror:
            logger.error(f"Network error sending to {user.email}")
            return False, "Network connection error"
            
        except Exception as e:
            logger.error(f"Unexpected error sending to {user.email}: {str(e)}")
            return False, f"Email sending failed: {str(e)}"
        
    except Exception as e:
        logger.error(f"Failed to create verification token for {user.email}: {str(e)}")
        return False, f"System error: {str(e)}"


# Add email delivery status checker
def check_email_delivery_status():
    """Check recent email delivery success rates"""
    from datetime import timedelta
    from django.utils import timezone
    
    recent_time = timezone.now() - timedelta(hours=24)
    recent_verifications = EmailVerification.objects.filter(
        created_at__gte=recent_time,
        verification_type='email_verify'
    )
    
    total_sent = recent_verifications.count()
    used_tokens = recent_verifications.filter(is_used=True).count()
    
    if total_sent > 0:
        success_rate = (used_tokens / total_sent) * 100
        logger.info(f"Email delivery stats (24h): {used_tokens}/{total_sent} verified ({success_rate:.1f}%)")
        return success_rate
    
    return 0