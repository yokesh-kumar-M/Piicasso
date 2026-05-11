"""
PIIcasso Backend Tests — operations app
=========================================
Tests for notifications, messaging, breach search, and system settings.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from operations.models import Notification, Message, SystemSetting
from unittest.mock import patch
import os


class NotificationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("notifuser", password="Pass1234!")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create notifications
        Notification.objects.create(
            user=self.user,
            notification_type="SYSTEM",
            title="Test",
            description="Test notification",
        )
        Notification.objects.create(
            user=self.user,
            notification_type="GENERATION",
            title="Generated",
            description="Wordlist ready",
        )

    def test_get_notifications(self):
        response = self.client.get("/api/operations/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 2)

    def test_mark_notification_read(self):
        notif = Notification.objects.filter(user=self.user).first()
        response = self.client.post(
            "/api/operations/notifications/", {"id": notif.id}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        response = self.client.post(
            "/api/operations/notifications/", {"action": "mark_all_read"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Notification.objects.filter(user=self.user, is_read=False).count(), 0
        )

    def test_clear_notifications(self):
        response = self.client.delete("/api/operations/notifications/")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)


class MessagingTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("msgadmin", password="Pass1234!")
        self.user = User.objects.create_user("msguser", password="Pass1234!")

    def test_user_sends_message_to_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.post(
            "/api/operations/messages/", {"content": "Help me!"}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)

    def test_admin_sends_message_to_user(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.post(
            "/api/operations/messages/",
            {
                "recipient": self.user.id,
                "content": "How can I help?",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_user_gets_conversation(self):
        Message.objects.create(sender=self.user, recipient=self.admin, content="Hello")
        Message.objects.create(
            sender=self.admin, recipient=self.user, content="Hi back"
        )

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get("/api/operations/messages/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 2)


class BreachSearchTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("breachuser", password="Pass1234!")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_breach_search_empty_query(self):
        response = self.client.post(
            "/api/operations/breach-search/", {"query": ""}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    @patch.dict(os.environ, {}, clear=False)
    @patch("operations.views.k_anonymity_breach_count", return_value=0)
    def test_breach_search_valid_email_does_not_500(self, mock_breach_count):
        os.environ.pop("HIBP_API_KEY", None)
        response = self.client.post(
            "/api/operations/breach-search/",
            {"query": "person@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("risk_score", response.data)
        self.assertEqual(response.data["internal_matches"], 0)

    @patch.dict(os.environ, {"HIBP_API_KEY": "test-key"}, clear=False)
    @patch("requests.get")
    @patch("operations.views.k_anonymity_breach_count", return_value=0)
    def test_breach_search_email_uses_hibp_account_path(
        self, mock_breach_count, mock_get
    ):
        mock_get.return_value.status_code = 404

        response = self.client.post(
            "/api/operations/breach-search/",
            {"query": "person@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        mock_get.assert_called_once_with(
            "https://haveibeenpwned.com/api/v3/breachedaccount/person%40example.com",
            params={"truncateResponse": "true"},
            headers={
                "User-Agent": "PIIcasso-SecurityAudit",
                "hibp-api-key": "test-key",
            },
            timeout=10,
        )

    @patch("operations.views.k_anonymity_breach_count", return_value=42)
    def test_breach_search_password_check(self, mock_breach_count):
        """Test password exposure handling without relying on the live HIBP API."""
        response = self.client.post(
            "/api/operations/breach-search/", {"query": "password123"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("password_exposures", response.data)
        self.assertEqual(response.data["password_exposures"], 42)

    @patch("operations.views.k_anonymity_breach_count", return_value=0)
    def test_breach_search_non_email_uses_internal_matches_safely(
        self, mock_breach_count
    ):
        response = self.client.post(
            "/api/operations/breach-search/", {"query": "password123"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["internal_matches"], 0)
        self.assertEqual(response.data["risk_score"], 0)

    def test_unauthenticated_breach_search(self):
        client = APIClient()
        response = client.post(
            "/api/operations/breach-search/", {"query": "test"}, format="json"
        )
        self.assertEqual(response.status_code, 401)


class SystemSettingsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            "settingsadmin", password="Pass1234!"
        )
        self.user = User.objects.create_user("settingsuser", password="Pass1234!")

    def test_admin_get_settings(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.get("/api/operations/settings/")
        self.assertEqual(response.status_code, 200)

    def test_user_cannot_get_settings(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get("/api/operations/settings/")
        self.assertEqual(response.status_code, 403)

    def test_admin_set_setting(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        response = client.post(
            "/api/operations/settings/",
            {
                "key": "maintenance_mode",
                "value": "true",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(SystemSetting.get("maintenance_mode"), "true")
