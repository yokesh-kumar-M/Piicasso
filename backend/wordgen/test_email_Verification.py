# backend/wordgen/tests/test_email_verification.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from ..models import UserProfile, EmailVerification
from ..email_utils import send_verification_email_safe

class EmailVerificationTestCase(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)

    def test_rate_limiting_works(self):
        """Test that rate limiting prevents spam"""
        # First email should work
        can_send, message = self.profile.can_send_verification_email()
        self.assertTrue(can_send)
        
        # Record email sent
        self.profile.record_verification_email_sent()
        
        # Immediate second email should be rate limited
        can_send, message = self.profile.can_send_verification_email()
        self.assertFalse(can_send)
        self.assertIn("wait", message.lower())

    def test_daily_limit_enforcement(self):
        """Test daily email limit"""
        # Send 5 emails (daily limit)
        for i in range(5):
            self.profile.verification_email_count = i
            self.profile.last_verification_sent = timezone.now()
            self.profile.verification_cooldown_until = None  # Remove cooldown for test
            self.profile.save()
        
        # 6th email should be blocked
        can_send, message = self.profile.can_send_verification_email()
        self.assertFalse(can_send)
        self.assertIn("daily", message.lower())

    @patch('wordgen.email_utils._send_verification_email_internal')
    def test_send_verification_email_safe(self, mock_send):
        """Test the main email sending function"""
        mock_send.return_value = True
        
        success, message, email = send_verification_email_safe(self.user)
        
        self.assertTrue(success)
        self.assertEqual(email, 'test@example.com')
        mock_send.assert_called_once()

    def test_nonexistent_user_security(self):
        """Test that we don't reveal if email exists"""
        success, message, email = send_verification_email_safe('nonexistent@example.com')
        
        # Should return success to avoid revealing user existence
        self.assertTrue(success)
        self.assertIsNone(email)
        self.assertIn("if an account", message.lower())