# backend/wordgen/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_async(self, subject, html_content, text_content, recipient_email, from_email=None):
    """Send email asynchronously with retries"""
    try:
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        result = send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        
        logger.info(f"Async email sent successfully to {recipient_email}")
        return result
        
    except Exception as exc:
        logger.error(f"Email send failed: {exc}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        
        # Final failure
        logger.error(f"Email send failed permanently for {recipient_email}")
        return False

@shared_task
def send_verification_email_async(user_id):
    """Send verification email asynchronously"""
    try:
        from django.contrib.auth.models import User
        from .models import EmailVerification
        
        user = User.objects.get(id=user_id)
        
        # Create verification token
        verification = EmailVerification.objects.create(
            user=user,
            verification_type='email_verify'
        )
        
        # Render content
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/verify-email/{verification.token}"
        
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'PIIcasso',
        }
        
        html_content = render_to_string('emails/email_verification.html', context)
        text_content = render_to_string('emails/email_verification.txt', context)
        
        # Send async
        return send_email_async.delay(
            subject='PIIcasso - Verify Your Email Address',
            html_content=html_content,
            text_content=text_content,
            recipient_email=user.email
        )
        
    except Exception as e:
        logger.error(f"Async verification email setup failed: {e}")
        return False