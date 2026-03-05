"""
PIIcasso Backend Tests — wordgen app
=====================================
Tests for auth, registration, PII submission, history, admin, terminal, and health.
"""
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from generator.models import GenerationHistory


class HealthCheckTest(TestCase):
    def test_health_check_returns_200(self):
        client = APIClient()
        response = client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertIn('database', response.data)


class RegistrationTest(TestCase):
    def test_register_success(self):
        client = APIClient()
        response = client.post('/api/register/', {
            'username': 'testuser',
            'password': 'SecurePass123!',
            'email': 'test@example.com',
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_register_missing_fields(self):
        client = APIClient()
        response = client.post('/api/register/', {'username': '', 'password': ''})
        self.assertEqual(response.status_code, 400)

    def test_register_short_username(self):
        client = APIClient()
        response = client.post('/api/register/', {
            'username': 'ab',
            'password': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, 400)

    def test_register_duplicate_username(self):
        User.objects.create_user('taken', password='pass1234!')
        client = APIClient()
        response = client.post('/api/register/', {
            'username': 'taken',
            'password': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, 400)

    def test_register_weak_password(self):
        client = APIClient()
        response = client.post('/api/register/', {
            'username': 'newuser',
            'password': '123',
        })
        self.assertEqual(response.status_code, 400)


class AuthTokenTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='authuser', password='StrongPass1!', email='auth@test.com'
        )
        self.client = APIClient()

    def test_login_success(self):
        response = self.client.post('/api/token/', {
            'username': 'authuser',
            'password': 'StrongPass1!',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/token/', {
            'username': 'authuser',
            'password': 'wrong',
        })
        self.assertEqual(response.status_code, 401)

    def test_login_inactive_user(self):
        """1.3 fix: inactive users should NOT get valid tokens."""
        self.user.is_active = False
        self.user.save()
        response = self.client.post('/api/token/', {
            'username': 'authuser',
            'password': 'StrongPass1!',
        })
        self.assertEqual(response.status_code, 401)

    def test_token_refresh(self):
        login = self.client.post('/api/token/', {
            'username': 'authuser',
            'password': 'StrongPass1!',
        })
        refresh = login.data['refresh']
        response = self.client.post('/api/token/refresh/', {'refresh': refresh})
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)


class PasswordResetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='resetuser', password='OldPass123!', email='reset@test.com'
        )
        self.client = APIClient()

    def test_request_reset_existing_email(self):
        with patch('wordgen.auth_views.send_mail') as mock_mail:
            response = self.client.post('/api/auth/request-reset/', {'email': 'reset@test.com'})
        self.assertEqual(response.status_code, 200)
        # Should not reveal if email exists
        self.assertIn('recovery code', response.data['message'].lower())

    def test_request_reset_nonexistent_email(self):
        response = self.client.post('/api/auth/request-reset/', {'email': 'no@test.com'})
        # Same response to mask email existence
        self.assertEqual(response.status_code, 200)

    def test_verify_reset_otp(self):
        cache.set('pwd_reset_otp_reset@test.com', '123456', timeout=600)
        response = self.client.post('/api/auth/verify-reset/', {
            'email': 'reset@test.com',
            'otp': '123456',
            'new_password': 'NewStrongPass1!',
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass1!'))

    def test_verify_reset_wrong_otp(self):
        cache.set('pwd_reset_otp_reset@test.com', '123456', timeout=600)
        response = self.client.post('/api/auth/verify-reset/', {
            'email': 'reset@test.com',
            'otp': '000000',
            'new_password': 'NewStrongPass1!',
        })
        self.assertEqual(response.status_code, 400)


class PiiSubmitTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='piiuser', password='StrongPass1!'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch('wordgen.views.call_gemini_api', return_value='password1\npassword2\npassword3')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'})
    def test_submit_success(self, mock_gemini):
        response = self.client.post('/api/submit/', {
            'full_name': 'John Smith',
            'birth_year': '1990',
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn('wordlist', response.data)
        self.assertIn('id', response.data)

    def test_submit_empty_data(self):
        response = self.client.post('/api/submit/', {})
        self.assertEqual(response.status_code, 400)

    def test_submit_unauthenticated(self):
        client = APIClient()  # No auth
        response = client.post('/api/submit/', {'full_name': 'Test'})
        self.assertEqual(response.status_code, 401)

    def test_submit_sanitizes_html(self):
        """1.6 fix: HTML tags should be escaped in stored PII data."""
        with patch('wordgen.views.call_gemini_api', return_value='pass1'):
            with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'}):
                response = self.client.post('/api/submit/', {
                    'full_name': '<script>alert("xss")</script>',
                })
        if response.status_code == 201:
            record = GenerationHistory.objects.get(id=response.data['id'])
            self.assertNotIn('<script>', record.pii_data.get('full_name', ''))
            self.assertIn('&lt;script&gt;', record.pii_data.get('full_name', ''))


class HistoryTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='histuser', password='StrongPass1!')
        self.other_user = User.objects.create_user(username='other', password='StrongPass1!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create test records
        self.record = GenerationHistory.objects.create(
            user=self.user, pii_data={'full_name': 'Test'}, wordlist=['pass1', 'pass2']
        )
        self.other_record = GenerationHistory.objects.create(
            user=self.other_user, pii_data={'full_name': 'Other'}, wordlist=['pass3']
        )

    def test_history_lists_own_records(self):
        response = self.client.get('/api/history/')
        self.assertEqual(response.status_code, 200)
        ids = [r['id'] for r in response.data['results']]
        self.assertIn(self.record.id, ids)
        self.assertNotIn(self.other_record.id, ids)

    def test_delete_own_record(self):
        response = self.client.delete(f'/api/history/{self.record.id}/')
        self.assertEqual(response.status_code, 204)

    def test_cannot_delete_other_record(self):
        response = self.client.delete(f'/api/history/{self.other_record.id}/')
        self.assertEqual(response.status_code, 403)

    def test_download_own_wordlist(self):
        response = self.client.get(f'/api/download/{self.record.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('pass1', response.content.decode())

    def test_cannot_download_other_wordlist(self):
        response = self.client.get(f'/api/download/{self.other_record.id}/')
        self.assertEqual(response.status_code, 403)


class AdminTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', password='AdminPass1!', email='admin@test.com'
        )
        self.user = User.objects.create_user(
            username='normaluser', password='UserPass1!'
        )
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)
        self.user_client = APIClient()
        self.user_client.force_authenticate(user=self.user)

    def test_admin_can_access_admin_panel(self):
        response = self.admin_client.get('/api/admin/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('users', response.data)

    def test_regular_user_cannot_access_admin(self):
        response = self.user_client.get('/api/admin/')
        self.assertEqual(response.status_code, 403)

    def test_admin_block_user(self):
        response = self.admin_client.post('/api/admin/', {
            'action': 'block',
            'user_id': self.user.id,
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_admin_unblock_user(self):
        self.user.is_active = False
        self.user.save()
        response = self.admin_client.post('/api/admin/', {
            'action': 'unblock',
            'user_id': self.user.id,
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_admin_delete_user(self):
        uid = self.user.id
        response = self.admin_client.delete(f'/api/admin/?user_id={uid}')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=uid).exists())

    def test_cannot_delete_admin(self):
        other_admin = User.objects.create_superuser('admin2', password='Pass1234!')
        response = self.admin_client.delete(f'/api/admin/?user_id={other_admin.id}')
        self.assertEqual(response.status_code, 400)


class SystemLogViewTest(TestCase):
    """1.1 fix: SystemLogView should require auth and superuser."""

    def setUp(self):
        self.admin = User.objects.create_superuser('logadmin', password='Pass1234!')
        self.user = User.objects.create_user('loguser', password='Pass1234!')

    def test_anonymous_cannot_access_logs(self):
        client = APIClient()
        response = client.get('/api/logs/')
        self.assertEqual(response.status_code, 401)

    def test_regular_user_cannot_access_logs(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get('/api/logs/')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_access_logs(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/logs/')
        self.assertEqual(response.status_code, 200)


class SimulatedTerminalTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('termuser', password='Pass1234!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_help_command(self):
        response = self.client.post('/api/terminal/', {'command': 'help'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('Available' in line for line in response.data['output']))

    def test_unauthorized_command(self):
        response = self.client.post('/api/terminal/', {'command': 'rm -rf /'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('not authorized' in line for line in response.data['output']))

    def test_unauthenticated_access(self):
        client = APIClient()
        response = client.post('/api/terminal/', {'command': 'help'})
        self.assertEqual(response.status_code, 401)


class DownloadTokenTest(TestCase):
    """1.2 fix: Signed download token flow."""

    def setUp(self):
        self.user = User.objects.create_user('dluser', password='Pass1234!')
        self.record = GenerationHistory.objects.create(
            user=self.user, pii_data={'full_name': 'Test'}, wordlist=['pass1']
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_generate_download_token(self):
        response = self.client.post('/api/download-token/', {
            'file_type': 'wordlist',
            'record_id': self.record.id,
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('download_token', response.data)

    def test_download_with_signed_token(self):
        # Get the token
        token_response = self.client.post('/api/download-token/', {
            'file_type': 'wordlist',
            'record_id': self.record.id,
        })
        download_token = token_response.data['download_token']

        # Use it to download (no auth headers needed)
        anon_client = APIClient()
        response = anon_client.get(
            f'/api/file/wordlist/{self.record.id}/',
            {'token': download_token},
        )
        self.assertEqual(response.status_code, 200)

    def test_download_with_invalid_token(self):
        client = APIClient()
        response = client.get(
            f'/api/file/wordlist/{self.record.id}/',
            {'token': 'invalid-token'},
        )
        self.assertEqual(response.status_code, 401)

    def test_cannot_generate_token_for_other_users_record(self):
        other = User.objects.create_user('other', password='Pass1234!')
        other_record = GenerationHistory.objects.create(
            user=other, pii_data={'full_name': 'Other'}, wordlist=['pass2']
        )
        response = self.client.post('/api/download-token/', {
            'file_type': 'wordlist',
            'record_id': other_record.id,
        })
        self.assertEqual(response.status_code, 403)


class UserProfileTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            'profuser', password='Pass1234!', email='prof@test.com',
            first_name='John', last_name='Doe'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'profuser')
        self.assertEqual(response.data['email'], 'prof@test.com')

    def test_update_profile(self):
        response = self.client.patch('/api/profile/', {
            'first_name': 'Jane',
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Jane')
