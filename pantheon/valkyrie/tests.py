from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .services.entropy_service import EntropyService
from .services.hibp_service import HibpService


class ValkyrieSecurityTests(TestCase):
    def test_entropy_calculation(self):
        weak_entropy = EntropyService.calculate_entropy("123456")
        strong_entropy = EntropyService.calculate_entropy("K@li#L1nux$2026!Str0ng")
        self.assertGreater(strong_entropy, weak_entropy)

    def test_evaluate_password_pii_correlation(self):
        pii = {"pets_name": "Shadow", "birth_year": "1992"}
        result = EntropyService.evaluate_password("Shadow1992!", pii_data=pii)
        self.assertTrue(any("personal identifier" in v for v in result["vulnerabilities"]))

    @patch.object(HibpService, "get_breach_count", return_value=42)
    def test_score_view_with_breach(self, mock_hibp):
        client = APIClient()
        response = client.post("/api/password/score/", {"password": "Password123!"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get("breach_count"), 42)
        self.assertEqual(response.data.get("vulnerability_level"), "critical")

