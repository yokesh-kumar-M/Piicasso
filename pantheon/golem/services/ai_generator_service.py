import logging
import os

from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, field_validator

from .pattern_engine_service import PatternEngineService

logger = logging.getLogger("golem.ai")


class WordlistResponse(BaseModel):
    wordlist: list[str] = Field(min_length=1, max_length=1000)

    @field_validator("wordlist")
    @classmethod
    def normalize_candidates(cls, values):
        normalized = []
        seen = set()
        for value in values:
            if not isinstance(value, str):
                continue
            candidate = value.strip()
            if not candidate or "\n" in candidate or "\r" in candidate or len(candidate) > 256:
                continue
            if candidate not in seen:
                normalized.append(candidate)
                seen.add(candidate)
        if not normalized:
            raise ValueError("No usable wordlist candidates returned")
        return normalized


class AiGeneratorService:
    @staticmethod
    def generate_wordlist(pii_data, pattern_mode="standard", limit=1000):
        api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        model_name = getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")

        if not api_key or "your-gemini" in str(api_key).lower():
            logger.info("GEMINI_API_KEY unset or placeholder; falling back to deterministic synthesis.")
            return PatternEngineService.generate_deterministic_candidates(pii_data, pattern_mode, limit)

        try:
            client = genai.Client(api_key=api_key)
            masked_pii = PatternEngineService.mask_pii_for_api(pii_data)
            prompt = PatternEngineService.build_prompt(masked_pii, pattern_mode)

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=WordlistResponse,
                    temperature=0.7,
                ),
            )
            parsed = WordlistResponse.model_validate_json(response.text)
            return parsed.wordlist[:limit]
        except Exception as exc:
            logger.warning("Gemini API call failed (%s); using deterministic fallback.", exc)
            return PatternEngineService.generate_deterministic_candidates(pii_data, pattern_mode, limit)

