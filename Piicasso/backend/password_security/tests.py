import importlib
import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from password_security.models import PasswordAnalysis

User = get_user_model()


class PasswordSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="testpassword123")
        self.client.force_authenticate(user=self.user)

    def test_password_analyze_no_password(self):
        response = self.client.post("/api/password/analyze/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_analyze_weak_password(self):
        response = self.client.post("/api/password/analyze/", {"password": "password"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("score" in response.data)
        self.assertLessEqual(response.data["score"], 20)
        self.assertEqual(response.data["level"], "critical")

    def test_password_analyze_strong_password(self):
        response = self.client.post(
            "/api/password/analyze/",
            {"password": "CorrectHorseBatteryStaple!@#123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("score" in response.data)
        self.assertGreaterEqual(response.data["score"], 60)
        self.assertIn(response.data["level"], ["low", "medium"])

    @patch("password_security.views.k_anonymity_breach_count", return_value=42)
    def test_breached_password_score_is_capped(self, _breach_check):
        response = self.client.post(
            "/api/password/analyze/",
            {"password": "CorrectHorseBatteryStaple!@#123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["level"], "critical")
        self.assertLessEqual(response.data["score"], 10)
        self.assertEqual(response.data["breach_count"], 42)

    @patch("password_security.views.k_anonymity_breach_count", return_value=-1)
    def test_personal_information_is_not_echoed_in_findings(self, _breach_check):
        response = self.client.post(
            "/api/password/analyze/",
            {
                "password": "AliceExample!123",
                "pii_data": {"name": "AliceExample"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        findings = " ".join(response.data["vulnerabilities"])
        self.assertIn("personal information", findings.lower())
        self.assertNotIn("aliceexample", findings.lower())

    def test_user_preferences(self):
        # Update preferences
        response = self.client.put(
            "/api/password/preferences/",
            {"default_mode": "security", "last_mode": "security"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["default_mode"], "security")

        # Get preferences
        response = self.client.get("/api/password/preferences/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["default_mode"], "security")


class EncryptedPiiRepairMigrationTests(TestCase):
    def test_plaintext_legacy_row_is_encrypted_idempotently(self):
        user = User.objects.create_user(username="migration-user", password="testpassword123")
        analysis = PasswordAnalysis.objects.create(
            user=user,
            pii_data=None,
            password_hash="a" * 64,
            vulnerability_level="low",
        )
        legacy_value = json.dumps({"email": "legacy@example.com"})
        table = connection.ops.quote_name(PasswordAnalysis._meta.db_table)

        with connection.cursor() as cursor:
            cursor.execute(
                f"UPDATE {table} SET pii_data = %s WHERE id = %s",  # noqa: S608 - trusted model table
                [legacy_value, analysis.id],
            )

        migration = importlib.import_module("password_security.migrations.0005_repair_plaintext_pii_data")
        schema_editor = SimpleNamespace(connection=connection)
        migration.encrypt_plaintext_rows(None, schema_editor)
        migration.encrypt_plaintext_rows(None, schema_editor)

        analysis.refresh_from_db()
        self.assertEqual(analysis.pii_data, {"email": "legacy@example.com"})

        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT pii_data FROM {table} WHERE id = %s",  # noqa: S608 - trusted model table
                [analysis.id],
            )
            stored_value = cursor.fetchone()[0]
        self.assertNotEqual(stored_value, legacy_value)
