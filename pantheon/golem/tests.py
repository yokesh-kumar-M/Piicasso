from io import BytesIO

from django.test import TestCase
from rest_framework.test import APIClient

from .persistence.models import GenerationHistory
from .services.export_service import ExportService
from .services.pattern_engine_service import PatternEngineService


class GolemEngineTests(TestCase):
    def test_pattern_engine_deterministic(self):
        pii = {
            "full_name": "Thomas Anderson",
            "birth_year": "1999",
            "pets_name": "Neo",
        }
        candidates = PatternEngineService.generate_deterministic_candidates(pii, pattern_mode="standard", limit=50)
        self.assertTrue(len(candidates) > 0)
        self.assertTrue(any("Thomas" in c or "Neo" in c for c in candidates))

    def test_pii_submit_api(self):
        client = APIClient()
        payload = {
            "full_name": "Alice Wonderland",
            "birth_year": "1995",
            "pattern_mode": "standard",
            "limit": 20,
        }
        response = client.post("/api/submit/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("wordlist", response.data)
        self.assertIn("cache_key", response.data)

    def test_pdf_report_generation(self):
        entry = GenerationHistory.objects.create(
            pii_data={"full_name": "Test Subject"},
            wordlist=["TestPass1!", "TestPass2!"],
            wordlist_count=2,
        )
        buffer = BytesIO()
        ExportService.generate_report_pdf(entry, buffer)
        self.assertTrue(buffer.tell() > 0)

