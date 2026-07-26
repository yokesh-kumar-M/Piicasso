from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase

from wordgen.llm_handler import WordlistResponse, call_gemini_api


class GeminiStructuredOutputTests(SimpleTestCase):
    @patch.dict(
        "os.environ",
        {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "test-model"},
        clear=True,
    )
    @patch("wordgen.llm_handler.genai.Client")
    def test_validated_structured_output_is_normalized(self, client_class):
        client = client_class.return_value
        client.models.generate_content.return_value = SimpleNamespace(
            parsed=WordlistResponse(wordlist=[" Alpha!1 ", "Beta#2", "Alpha!1"]),
            text=None,
        )

        result = call_gemini_api("private prompt", pii_data={"full_name": "Alpha"})

        self.assertEqual(result, "Alpha!1\nBeta#2")
        call = client.models.generate_content.call_args
        self.assertEqual(call.kwargs["model"], "test-model")
        self.assertEqual(call.kwargs["contents"], "private prompt")
        self.assertEqual(call.kwargs["config"].response_mime_type, "application/json")

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"}, clear=True)
    @patch("wordgen.llm_handler.genai.Client")
    def test_malformed_structured_output_uses_local_fallback(self, client_class):
        client_class.return_value.models.generate_content.return_value = SimpleNamespace(
            parsed={"wordlist": []},
            text=None,
        )

        result = call_gemini_api("private prompt", pii_data={"full_name": "Alpha"})

        self.assertIn("Alpha", result.splitlines())

    @patch.dict("os.environ", {}, clear=True)
    @patch("wordgen.llm_handler.genai.Client")
    def test_missing_api_key_does_not_initialize_remote_client(self, client_class):
        result = call_gemini_api("private prompt", pii_data={"full_name": "Alpha"})

        client_class.assert_not_called()
        self.assertIn("Alpha", result.splitlines())

    def test_candidates_with_embedded_newlines_are_rejected(self):
        with self.assertRaises(ValueError):
            WordlistResponse(wordlist=["first\nsecond"])
