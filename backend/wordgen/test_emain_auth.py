import uuid
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.urls import reverse
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch

from .models import EmailVerification, UserProfile
from .email_utils import send_verification_email, send_password_reset_email


class EmailVerificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_email_verification_creation(self):
        """Test email verification token creation"""
        verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='email_verify'
        )
        
        self.assertEqual(verification.user, self.user)
        self.assertEqual(verification.verification_type, 'email_verify')
        self.assertFalse(verification.is_used)
        self.assertIsInstance(verification.token, uuid.UUID)

    def test_token_expiration(self):
        """Test token expiration logic"""
        # Create an old email verification token
        old_verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='email_verify'
        )
        # Manually set created_at to 25 hours ago
        old_verification.created_at = timezone.now() - timedelta(hours=25)
        old_verification.save()
        
        self.assertTrue(old_verification.is_expired)
        self.assertFalse(old_verification.is_valid)

        # Create an old password reset token
        old_reset = EmailVerification.objects.create(
            user=self.user,
            verification_type='password_reset'
        )
        # Manually set created_at to 2 hours ago
        old_reset.created_at = timezone.now() - timedelta(hours=2)
        old_reset.save()
        
        self.assertTrue(old_reset.is_expired)
        self.assertFalse(old_reset.is_valid)

    def test_mark_as_used(self):
        """Test marking token as used"""
        verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='email_verify'
        )
        
        self.assertFalse(verification.is_used)
        self.assertTrue(verification.is_valid)
        
        verification.mark_as_used()
        verification.refresh_from_db()
        
        self.assertTrue(verification.is_used)
        self.assertFalse(verification.is_valid)


class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_user_profile_creation(self):
        """Test user profile creation"""
        profile = UserProfile.objects.create(user=self.user)
        
        self.assertEqual(profile.user, self.user)
        self.assertFalse(profile.email_verified)
        self.assertIsNone(profile.email_verified_at)

    def test_get_or_create_profile(self):
        """Test get_or_create_profile method"""
        profile = UserProfile.get_or_create_profile(self.user)
        
        self.assertEqual(profile.user, self.user)
        self.assertFalse(profile.email_verified)
        
        # Test that it returns existing profile
        profile2 = UserProfile.get_or_create_profile(self.user)
        self.assertEqual(profile.id, profile2.id)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class EmailUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.user)

    def test_send_verification_email(self):
        """Test sending verification email"""
        result = send_verification_email(self.user)
        
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('PIIcasso', email.subject)
        self.assertIn('verify', email.subject.lower())
        
        # Check that verification token was created
        verification = EmailVerification.objects.filter(
            user=self.user,
            verification_type='email_verify'
        ).first()
        self.assertIsNotNone(verification)

    def test_send_password_reset_email(self):
        """Test sending password reset email"""
        result = send_password_reset_email(self.user)
        
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)
        
        email = mail.outbox[0]
        self.assertEqual(email.to, ['test@example.com'])
        self.assertIn('PIIcasso', email.subject)
        self.assertIn('reset', email.subject.lower())
        
        # Check that reset token was created
        verification = EmailVerification.objects.filter(
            user=self.user,
            verification_type='password_reset'
        ).first()
        self.assertIsNotNone(verification)


class RegistrationAPITest(APITestCase):
    def test_successful_registration(self):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'ComplexPass123!',
            'confirm_password': 'ComplexPass123!'
        }
        
        with override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            response = self.client.post(reverse('register'), data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('email_sent', response.data)
        
        # Check user was created
        user = User.objects.get(username='newuser')
        self.assertEqual(user.email, 'newuser@example.com')
        
        # Check profile was created
        profile = UserProfile.objects.get(user=user)
        self.assertFalse(profile.email_verified)

    def test_duplicate_username_registration(self):
        """Test registration with duplicate username"""
        User.objects.create_user(username='existing', email='existing@example.com')
        
        data = {
            'username': 'existing',
            'email': 'different@example.com',
            'password': 'ComplexPass123!',
            'confirm_password': 'ComplexPass123!'
        }
        
        response = self.client.post(reverse('register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('details', response.data)

    def test_password_mismatch(self):
        """Test registration with password mismatch"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'ComplexPass123!',
            'confirm_password': 'DifferentPass456!'
        }
        
        response = self.client.post(reverse('register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailVerificationAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            email_verified=False
        )

    def test_successful_email_verification(self):
        """Test successful email verification"""
        verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='email_verify'
        )
        
        data = {'token': str(verification.token)}
        response = self.client.post(reverse('verify_email'), data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('verified', response.data)
        self.assertTrue(response.data['verified'])
        
        # Check profile was updated
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.email_verified)
        self.assertIsNotNone(self.profile.email_verified_at)
        
        # Check token was marked as used
        verification.refresh_from_db()
        self.assertTrue(verification.is_used)

    def test_invalid_token_verification(self):
        """Test verification with invalid token"""
        data = {'token': str(uuid.uuid4())}
        response = self.client.post(reverse('verify_email'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('details', response.data)

    def test_expired_token_verification(self):
        """Test verification with expired token"""
        verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='email_verify'
        )
        # Make token expired
        verification.created_at = timezone.now() - timedelta(hours=25)
        verification.save()
        
        data = {'token': str(verification.token)}
        response = self.client.post(reverse('verify_email'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['details']['token'][0].lower())


class LoginAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_login_unverified_user(self):
        """Test login attempt with unverified email"""
        UserProfile.objects.create(user=self.user, email_verified=False)
        
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(reverse('login'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email_not_verified', response.data['details'])

    def test_login_verified_user(self):
        """Test successful login with verified email"""
        profile = UserProfile.objects.create(user=self.user, email_verified=True)
        profile.email_verified_at = timezone.now()
        profile.save()
        
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(reverse('login'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        UserProfile.objects.create(user=self.user, email_verified=True)
        
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(reverse('login'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordResetAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            email_verified=True,
            email_verified_at=timezone.now()
        )

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_password_reset_request(self):
        """Test password reset request"""
        data = {'email': 'test@example.com'}
        response = self.client.post(reverse('password_reset_request'), data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        
        # Check that reset token was created
        verification = EmailVerification.objects.filter(
            user=self.user,
            verification_type='password_reset'
        ).first()
        self.assertIsNotNone(verification)

    def test_password_reset_confirm(self):
        """Test password reset confirmation"""
        verification = EmailVerification.objects.create(
            user=self.user,
            verification_type='password_reset'
        )
        
        data = {
            'token': str(verification.token),
            'new_password': 'NewComplexPass123!',
            'confirm_password': 'NewComplexPass123!'
        }
        
        response = self.client.post(reverse('password_reset_confirm'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check password was updated
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewComplexPass123!'))
        
        # Check token was marked as used
        verification.refresh_from_db()
        self.assertTrue(verification.is_used)


class ResendVerificationAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.user, email_verified=False)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_resend_verification(self):
        """Test resending verification email"""
        data = {'email': 'test@example.com'}
        response = self.client.post(reverse('resend_verification'), data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('email_sent', response.data)
        self.assertTrue(response.data['email_sent'])
        
        self.assertEqual(len(mail.outbox), 1)

    def test_resend_to_verified_user(self):
        """Test resending verification to already verified user"""
        # Mark user as verified
        profile = self.user.profile
        profile.email_verified = True
        profile.save()
        
        data = {'email': 'test@example.com'}
        response = self.client.post(reverse('resend_verification'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already verified', response.data['details']['email'][0])


class PiiSubmissionTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(user=self.user)

    def authenticate(self):
        """Helper method to authenticate user"""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    @patch('wordgen.views.call_gemini_api')
    def test_pii_submission_unverified_user(self, mock_gemini):
        """Test PII submission with unverified email"""
        self.authenticate()
        
        data = {
            'full_name': 'John Doe',
            'birth_year': '1990'
        }
        
        response = self.client.post(reverse('submit_pii'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('email_not_verified', response.data)

    @patch('wordgen.views.call_gemini_api')
    def test_pii_submission_verified_user(self, mock_gemini):
        """Test PII submission with verified email"""
        # Verify user's email
        self.profile.email_verified = True
        self.profile.email_verified_at = timezone.now()
        self.profile.save()
        
        self.authenticate()
        
        # Mock the Gemini API response
        mock_gemini.return_value = "password1\npassword2\npassword3"
        
        data = {
            'full_name': 'John Doe',
            'birth_year': '1990'
        }
        
        response = self.client.post(reverse('submit_pii'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('wordlist', response.data)
        self.assertEqual(len(response.data['wordlist']), 3)