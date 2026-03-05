"""
PIIcasso Backend Tests — operations app
=========================================
Tests for notifications, messaging, breach search, and system settings.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from operations.models import Notification, Message, SystemSetting


class NotificationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('notifuser', password='Pass1234!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create notifications
        Notification.objects.create(
            user=self.user, notification_type='SYSTEM',
            title='Test', description='Test notification'
        )
        Notification.objects.create(
            user=self.user, notification_type='GENERATION',
            title='Generated', description='Wordlist ready'
        )

    def test_get_notifications(self):
        response = self.client.get('/api/operations/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 2)

    def test_mark_notification_read(self):
        notif = Notification.objects.filter(user=self.user).first()
        response = self.client.post('/api/operations/notifications/', {'id': notif.id})
        self.assertEqual(response.status_code, 200)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        response = self.client.post('/api/operations/notifications/', {'action': 'mark_all_read'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 0)

    def test_clear_notifications(self):
        response = self.client.delete('/api/operations/notifications/')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)


class MessagingTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('msgadmin', password='Pass1234!')
        self.user = User.objects.create_user('msguser', password='Pass1234!')

    def test_user_sends_message_to_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.post('/api/admin/messages/', {'content': 'Help me!'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)

    def test_admin_sends_message_to_user(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.post('/api/admin/messages/', {
            'recipient_id': self.user.id,
            'content': 'How can I help?',
        })
        self.assertEqual(response.status_code, 201)

    def test_user_gets_conversation(self):
        Message.objects.create(sender=self.user, recipient=self.admin, content='Hello')
        Message.objects.create(sender=self.admin, recipient=self.user, content='Hi back')

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get('/api/admin/messages/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)


class BreachSearchTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('breachuser', password='Pass1234!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_breach_search_empty_query(self):
        response = self.client.post('/api/operations/breach-search/', {'query': ''})
        self.assertEqual(response.status_code, 400)

    def test_breach_search_password_check(self):
        """Test password hash lookup (free API, no key needed)."""
        response = self.client.post('/api/operations/breach-search/', {'query': 'password123'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('password_exposures', response.data)
        # 'password123' should definitely be in breaches
        self.assertGreater(response.data['password_exposures'], 0)

    def test_unauthenticated_breach_search(self):
        client = APIClient()
        response = client.post('/api/operations/breach-search/', {'query': 'test'})
        self.assertEqual(response.status_code, 401)


class SystemSettingsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('settingsadmin', password='Pass1234!')
        self.user = User.objects.create_user('settingsuser', password='Pass1234!')

    def test_admin_get_settings(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get('/api/operations/settings/')
        self.assertEqual(response.status_code, 200)

    def test_user_cannot_get_settings(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get('/api/operations/settings/')
        self.assertEqual(response.status_code, 403)

    def test_admin_set_setting(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.post('/api/operations/settings/', {
            'key': 'maintenance_mode',
            'value': 'true',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(SystemSetting.get('maintenance_mode'), 'true')
