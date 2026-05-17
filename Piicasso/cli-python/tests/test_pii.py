"""Smoke tests for the local PII engine.

The full parity-with-JS check lives in the upstream piiEngine.js suite; these
tests just ensure the Python port is loading and producing reasonable output.
"""

from __future__ import annotations

import pytest

from piicasso.engine.pii import (
    detect_entities,
    generate_wordlist,
    human_time,
    redact_text,
    score_password,
)


def test_detect_email_and_phone():
    entities = detect_entities("ping john@example.com or 9876543210 anytime")
    types = {e["type"] for e in entities}
    assert "EMAIL" in types
    assert "PHONE" in types


def test_detect_returns_empty_on_clean_text():
    assert detect_entities("the quick brown fox jumps") == []


def test_redact_segments_round_trip():
    text = "email: a@b.co"
    entities = detect_entities(text)
    segments = redact_text(text, entities)
    rebuilt = "".join(seg["text"] for seg in segments)
    assert rebuilt == text


def test_score_password_weak_vs_strong():
    weak = score_password("password123")
    strong = score_password("Tr0ub4dor&3xtra!Long")
    assert weak["score"] < strong["score"]
    assert weak["rating"] in {"Trivially crackable", "Weak", "Moderate"}
    assert strong["rating"] in {"Strong", "Excellent"}


def test_score_picks_up_profile_match():
    pw = "JohnDoe1998"
    plain = score_password(pw)
    flagged = score_password(pw, {"name": "John Doe", "dob": "1998"})
    assert flagged["score"] <= plain["score"]
    assert any(r["kind"] == "pii" for r in flagged["reasons"])


def test_wordgen_emits_capped_count():
    out = generate_wordlist({"name": "John", "dob": "1998"}, limit=12)
    assert 1 <= len(out) <= 12
    assert "John" in out or "john" in out


def test_human_time_known_buckets():
    assert human_time(0) == "instant"
    assert "second" in human_time(5)
    assert "minute" in human_time(120)


def test_wordgen_requires_string_tokens():
    # Non-string values are ignored — pass an int and confirm we still get
    # candidates from the string token.
    out = generate_wordlist({"name": "Ada", "age": 42}, limit=5)
    assert out, "expected at least one candidate from string token"
