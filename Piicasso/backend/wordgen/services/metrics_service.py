"""
Mathematical Metrics Engine
============================
Computes Effectiveness Score (E) and Risk Density (Rd) as defined in the
PIIcasso Implementation Plan (CSE439 Capstone).

Formulas:
  E  = (Wp / Wt) × 100   — percentage of wordlist entries that contain PII tokens
  Rd = ΣMarkers / L       — PII token density per credential character

Both metrics are used to classify overall threat level (LOW/MEDIUM/HIGH/CRITICAL).
"""

import re
import logging

logger = logging.getLogger("wordgen")


# ---------------------------------------------------------------------------
# Token extraction
# ---------------------------------------------------------------------------

def extract_profile_tokens(pii_data: dict) -> list[str]:
    """
    Extracts meaningful string tokens from a flat PII dict.
    Returns a list of lowercase strings with length ≥ 2.
    """
    tokens: set[str] = set()

    for key, val in pii_data.items():
        if not val:
            continue

        raw_values: list[str] = val if isinstance(val, list) else [str(val)]

        for raw in raw_values:
            raw = str(raw).strip()
            if not raw:
                continue
            # Add full value and individual words
            tokens.add(raw.lower())
            for word in re.split(r"[\s,._\-/|]+", raw.lower()):
                if word:
                    tokens.add(word)

    # Filter out very short or purely numeric tokens
    return [t for t in tokens if len(t) >= 2 and not t.isdigit()]


# ---------------------------------------------------------------------------
# Effectiveness Score  E = (Wp / Wt) × 100
# ---------------------------------------------------------------------------

def calculate_effectiveness_score(wordlist: list, pii_data: dict) -> float:
    """
    E measures how many words in the wordlist contain at least one PII token.

    Higher E → the wordlist is highly profile-specific (more signal, less noise).

    Args:
        wordlist: List of plain strings (passwords) or scored dicts {"password": ..., "score": ...}
        pii_data: Flat dict of PII field values

    Returns:
        Effectiveness score as a float in [0, 100], rounded to 2 decimal places.
    """
    if not wordlist:
        return 0.0

    pii_tokens = extract_profile_tokens(pii_data)
    if not pii_tokens:
        return 0.0

    total = len(wordlist)
    matched = 0

    for entry in wordlist:
        word = (entry["password"] if isinstance(entry, dict) else str(entry)).lower()
        if any(token in word for token in pii_tokens):
            matched += 1

    e = (matched / total) * 100
    return round(e, 2)


# ---------------------------------------------------------------------------
# Risk Density  Rd = ΣMarkers / L
# ---------------------------------------------------------------------------

def calculate_risk_density(credential: str, pii_tokens: list[str]) -> float:
    """
    Rd for a single credential = (number of distinct PII tokens found) / len(credential).

    Higher Rd → more PII packed into a shorter string → higher risk.
    """
    if not credential or not pii_tokens:
        return 0.0

    L = len(credential)
    markers = sum(1 for token in pii_tokens if token and token.lower() in credential.lower())
    return round(markers / L, 4) if L > 0 else 0.0


def calculate_overall_risk_density(wordlist: list, pii_data: dict) -> float:
    """
    Average Risk Density across the entire wordlist.
    """
    if not wordlist:
        return 0.0

    pii_tokens = extract_profile_tokens(pii_data)
    if not pii_tokens:
        return 0.0

    total_rd = 0.0
    for entry in wordlist:
        word = entry["password"] if isinstance(entry, dict) else str(entry)
        total_rd += calculate_risk_density(word, pii_tokens)

    return round(total_rd / len(wordlist), 4)


# ---------------------------------------------------------------------------
# Threat Level
# ---------------------------------------------------------------------------

def determine_threat_level(effectiveness_score: float, risk_density: float) -> str:
    """
    Maps (E, Rd) to a qualitative threat level.

    Combined = (E / 100) + Rd
    ≥ 1.5 → CRITICAL
    ≥ 1.0 → HIGH
    ≥ 0.5 → MEDIUM
    else  → LOW
    """
    combined = (effectiveness_score / 100.0) + risk_density

    if combined >= 1.5:
        return "CRITICAL"
    elif combined >= 1.0:
        return "HIGH"
    elif combined >= 0.5:
        return "MEDIUM"
    else:
        return "LOW"


# ---------------------------------------------------------------------------
# All-in-one helper
# ---------------------------------------------------------------------------

def compute_metrics(wordlist: list, pii_data: dict) -> dict:
    """
    Computes E, Rd, threat_level and wordlist size in one call.

    Returns:
        {
          "effectiveness_score": float,   # 0–100
          "risk_density": float,          # 0–∞ (typically 0–1)
          "threat_level": str,            # LOW / MEDIUM / HIGH / CRITICAL
          "total_words": int,
          "matched_words": int,           # words containing PII tokens
        }
    """
    try:
        e = calculate_effectiveness_score(wordlist, pii_data)
        rd = calculate_overall_risk_density(wordlist, pii_data)
        threat = determine_threat_level(e, rd)

        pii_tokens = extract_profile_tokens(pii_data)
        matched = sum(
            1
            for entry in wordlist
            if any(
                t in (entry["password"] if isinstance(entry, dict) else str(entry)).lower()
                for t in pii_tokens
            )
        )

        return {
            "effectiveness_score": e,
            "risk_density": rd,
            "threat_level": threat,
            "total_words": len(wordlist),
            "matched_words": matched,
        }
    except Exception as exc:
        logger.warning(f"Metrics computation failed: {exc}")
        return {
            "effectiveness_score": 0.0,
            "risk_density": 0.0,
            "threat_level": "LOW",
            "total_words": len(wordlist),
            "matched_words": 0,
        }
