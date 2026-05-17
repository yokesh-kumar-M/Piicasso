"""Python port of ``frontend/src/lib/piiEngine.js``.

The goal is byte-for-byte feature parity: same regex patterns, same weights,
same scoring formula, same human-readable time format. Pure stdlib — no
dependencies, no network, instant.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Mapping, Optional, Tuple


# ---------------------------------------------------------------------------
# Regex patterns — order matters: earlier wins on overlap.
# Flags mirror the JS originals; ``re.IGNORECASE`` is set where the JS source
# uses the ``i`` flag.
# ---------------------------------------------------------------------------

PII_PATTERNS: List[Dict[str, Any]] = [
    {
        "type": "EMAIL",
        "label": "email",
        "re": re.compile(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", re.IGNORECASE),
        "weight": 0.18,
    },
    {
        "type": "PHONE",
        "label": "phone",
        "re": re.compile(r"(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}"),
        "weight": 0.16,
    },
    {
        "type": "SSN",
        "label": "ssn",
        "re": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        "weight": 0.30,
    },
    {
        "type": "CARD",
        "label": "card",
        "re": re.compile(r"\b(?:\d[ -]*?){13,16}\b"),
        "weight": 0.30,
    },
    {
        "type": "DOB",
        "label": "dob",
        "re": re.compile(
            r"\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b"
        ),
        "weight": 0.22,
    },
    {
        "type": "IP",
        "label": "ip",
        "re": re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b"),
        "weight": 0.10,
    },
    {
        "type": "ADDR",
        "label": "address",
        "re": re.compile(
            r"\b\d{1,5}\s+[A-Z][a-z]+\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Drive|Dr)\b"
        ),
        "weight": 0.14,
    },
    {
        "type": "ZIP",
        "label": "zip",
        "re": re.compile(r"\b\d{5}(?:-\d{4})?\b"),
        "weight": 0.06,
    },
    {
        "type": "NAME",
        "label": "name",
        "re": re.compile(
            r"\b(?:Mr|Ms|Mrs|Dr)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b"
            r"|\b[A-Z][a-z]{2,}\s[A-Z][a-z]{2,}\b"
        ),
        "weight": 0.18,
    },
]


def detect_entities(text: str) -> List[Dict[str, Any]]:
    """Detect PII entities in ``text``.

    Higher-priority overlaps win. Each entity is::

        {"type": "EMAIL", "label": "email", "weight": 0.18,
         "start": 0, "end": 16, "text": "john@example.com"}
    """
    if not text:
        return []

    found: List[Dict[str, Any]] = []
    for pat in PII_PATTERNS:
        ptype = pat["type"]
        for match in pat["re"].finditer(text):
            start = match.start()
            end = match.end()
            # Skip exact duplicates of same type at same start.
            if any(f["start"] == start and f["type"] == ptype for f in found):
                continue
            # Skip if fully contained within an earlier (higher-priority) match.
            if any(start >= f["start"] and end <= f["end"] for f in found):
                continue
            found.append(
                {
                    "type": ptype,
                    "label": pat["label"],
                    "weight": pat["weight"],
                    "start": start,
                    "end": end,
                    "text": match.group(0),
                }
            )

    # Sort by start ascending, then by span descending so the wider match wins
    # the dedupe sweep below.
    found.sort(key=lambda f: (f["start"], -(f["end"] - f["start"])))

    filtered: List[Dict[str, Any]] = []
    for f in found:
        if any(f["start"] < g["end"] and f["end"] > g["start"] for g in filtered):
            continue
        filtered.append(f)
    return filtered


def redact_text(text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Split ``text`` into a list of segments::

        [{"kind": "text", "text": "Hello "},
         {"kind": "redact", "text": "j@x.com", "label": "email", "type": "EMAIL"},
         ...]
    """
    if not entities:
        return [{"kind": "text", "text": text}]

    out: List[Dict[str, Any]] = []
    cursor = 0
    for e in entities:
        if cursor < e["start"]:
            out.append({"kind": "text", "text": text[cursor : e["start"]]})
        out.append(
            {
                "kind": "redact",
                "text": text[e["start"] : e["end"]],
                "label": e["label"],
                "type": e["type"],
            }
        )
        cursor = e["end"]
    if cursor < len(text):
        out.append({"kind": "text", "text": text[cursor:]})
    return out


def redact_to_string(text: str, mask: str = "[REDACTED:{label}]") -> str:
    """Convenience: collapse the redact segments into a single masked string."""
    entities = detect_entities(text)
    segments = redact_text(text, entities)
    parts: List[str] = []
    for seg in segments:
        if seg["kind"] == "redact":
            parts.append(mask.format(label=seg["label"].upper(), type=seg["type"]))
        else:
            parts.append(seg["text"])
    return "".join(parts)


# ---------------------------------------------------------------------------
# Password scoring
# ---------------------------------------------------------------------------


_COMMON_TOKENS: Tuple[str, ...] = (
    "password",
    "qwerty",
    "admin",
    "welcome",
    "letmein",
    "123456",
    "iloveyou",
    "sunshine",
    "monkey",
    "football",
    "dragon",
    "master",
    "summer",
)

_SEQUENTIAL_RE = re.compile(
    r"0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf", re.IGNORECASE
)
_REPEAT_RE = re.compile(r"(.)\1{2,}")
_YEAR_SUFFIX_RE = re.compile(r"(19|20)\d{2}$")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]")
_NON_ALNUM_MIXED_RE = re.compile(r"[^a-zA-Z0-9]")


def score_password(
    pw: str, profile: Optional[Mapping[str, Any]] = None
) -> Dict[str, Any]:
    """Score a password against an optional profile.

    Returns::

        {"score": 0..100, "guesses": float, "time": "1.2 hours",
         "reasons": [...], "rating": "Strong", "entropy": int}
    """
    if not pw:
        return {
            "score": 0,
            "guesses": 0,
            "time": "instant",
            "reasons": [],
            "rating": "—",
            "entropy": 0,
        }

    profile = profile or {}

    length = len(pw)
    has_lower = bool(re.search(r"[a-z]", pw))
    has_upper = bool(re.search(r"[A-Z]", pw))
    has_digit = bool(re.search(r"\d", pw))
    has_sym = bool(re.search(r"[^a-zA-Z0-9]", pw))

    pool = 0
    if has_lower:
        pool += 26
    if has_upper:
        pool += 26
    if has_digit:
        pool += 10
    if has_sym:
        pool += 32

    entropy = math.log2(max(pool, 1)) * length
    reasons: List[Dict[str, str]] = []
    penalty = 0
    low_pw = pw.lower()

    # Profile-based PII matching.
    for k, v in profile.items():
        if not isinstance(v, str) or len(v) < 3:
            continue
        lv = _NON_ALNUM_RE.sub("", v.lower())
        if not lv:
            continue
        slice_len = max(3, math.floor(len(lv) * 0.5))
        if lv[:slice_len] in low_pw:
            penalty += 22
            reasons.append({"kind": "pii", "label": f'Contains "{v}" ({k})'})

    # Common tokens — first hit only, matches JS ``break``.
    for c in _COMMON_TOKENS:
        if c in low_pw:
            penalty += 25
            reasons.append({"kind": "common", "label": f'Common token "{c}"'})
            break

    if _REPEAT_RE.search(pw):
        penalty += 8
        reasons.append({"kind": "pattern", "label": "Repeated characters"})
    if _SEQUENTIAL_RE.search(pw):
        penalty += 12
        reasons.append({"kind": "pattern", "label": "Sequential characters"})
    if _YEAR_SUFFIX_RE.search(pw):
        penalty += 14
        reasons.append({"kind": "pattern", "label": "Year suffix detected"})

    length_boost = 0
    if length >= 12:
        length_boost += 12
    if length >= 16:
        length_boost += 8
    if has_sym and has_upper and has_digit and has_lower:
        length_boost += 8

    raw = round(entropy * 1.4 - penalty + length_boost)
    score = max(0, min(100, raw))
    # math.pow handles the same overflow profile as JS Math.pow.
    guesses = math.pow(2, max(1, entropy - penalty * 0.5))
    time = human_time(guesses / 1e10)  # ~10B guesses/sec

    if score < 25:
        rating = "Trivially crackable"
    elif score < 45:
        rating = "Weak"
    elif score < 65:
        rating = "Moderate"
    elif score < 82:
        rating = "Strong"
    else:
        rating = "Excellent"

    return {
        "score": score,
        "guesses": guesses,
        "time": time,
        "reasons": reasons,
        "rating": rating,
        "entropy": round(entropy),
    }


def human_time(seconds: float) -> str:
    """Format ``seconds`` as a human-friendly duration.

    Mirrors the JS implementation exactly: cascading divisions through
    second → minute → hour → day → year → century, plural ``s`` for >=2,
    and a ``>1M centuries`` cap at the top.
    """
    if not math.isfinite(seconds) or seconds < 1:
        return "instant"

    # (divisor, name-of-CURRENT unit). The first row says "while still under
    # 60 of the current unit, we're in seconds"; if we cross that boundary the
    # name becomes "minute" and we divide by 60, etc.
    units: Tuple[Tuple[int, str], ...] = (
        (60, "second"),
        (60, "minute"),
        (24, "hour"),
        (365, "day"),
        (100, "year"),
        (1_000_000, "century"),
    )
    val = seconds
    name = "second"
    for div, n in units:
        if val < div:
            name = n
            break
        val /= div
        name = n

    if val > 1e6:
        return ">1M centuries"
    if val < 10:
        # ``toFixed(1)`` keeps one decimal, e.g. ``1.5``.
        text = f"{val:.1f}"
    else:
        text = str(int(round(val)))
    suffix = "s" if val >= 2 else ""
    return f"{text} {name}{suffix}"


# ---------------------------------------------------------------------------
# Adversarial wordlist
# ---------------------------------------------------------------------------


def generate_wordlist(profile: Mapping[str, Any], limit: int = 40) -> List[str]:
    """Generate up to ``limit`` candidate passwords from a profile."""
    tokens = [v for v in profile.values() if isinstance(v, str) and len(v) >= 2]
    years = ["2024", "2025", "1998", "1999", "2000", "2001"]
    symbols = ["", "!", "@", "#", "123", "1!"]
    out: List[str] = []
    seen = set()

    def _add(s: str) -> None:
        if s and s not in seen:
            seen.add(s)
            out.append(s)

    for t in tokens:
        base = _NON_ALNUM_MIXED_RE.sub("", t)
        if not base:
            continue
        _add(base)
        _add(base.lower())
        _add(base[0].upper() + base[1:].lower())
        for y in years:
            _add(base + y)
        for s in symbols:
            _add(base + s)
            _add(base.lower() + s)
        # Cheap leetspeak.
        leet = (
            base.lower()
            .replace("a", "@")
            .replace("e", "3")
            .replace("i", "1")
            .replace("o", "0")
        )
        _add(leet)

    if len(tokens) >= 2:
        for i, a_tok in enumerate(tokens):
            for j, b_tok in enumerate(tokens):
                if i == j:
                    continue
                a = _NON_ALNUM_MIXED_RE.sub("", a_tok)
                b = _NON_ALNUM_MIXED_RE.sub("", b_tok)
                if a and b:
                    _add(a + b)

    return out[:limit]
