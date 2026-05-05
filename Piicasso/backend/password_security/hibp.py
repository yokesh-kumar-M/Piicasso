"""
Have I Been Pwned — k-anonymity password range lookup.

Only the first 5 hex characters of the SHA-1 hash are ever sent to the
HIBP API.  The full hash never leaves this process, so the plaintext
password is never exposed to the third-party service.

Reference: https://haveibeenpwned.com/API/v3#PwnedPasswords
"""

import hashlib
import logging

import requests

logger = logging.getLogger("password_security")

_RANGE_URL = "https://api.pwnedpasswords.com/range/{prefix}"
_TIMEOUT = 10
_CACHE_TTL = 86_400  # 24 hours


def k_anonymity_breach_count(password: str) -> int:
    """
    Return the number of times *password* appears in HIBP's Pwned Passwords
    corpus, using the k-anonymity range API so the plaintext never leaves
    this process.

    Returns:
        int >= 0   — exposure count (0 means not found in the corpus)
        -1         — API or network error; caller should treat as "unknown"
    """
    cached = _get_cached(password)
    if cached is not None:
        return cached

    sha1 = hashlib.sha1(
        password.encode("utf-8"), usedforsecurity=False
    ).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        resp = requests.get(
            _RANGE_URL.format(prefix=prefix),
            headers={
                "User-Agent": "PIIcasso-SecurityAudit/2.0",
                # Ask HIBP to pad the response so response length doesn't
                # leak information about whether the prefix is common.
                "Add-Padding": "true",
            },
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()

        count = 0
        for line in resp.text.splitlines():
            line_suffix, _, line_count = line.strip().partition(":")
            if line_suffix == suffix:
                count = int(line_count)
                break

        _set_cached(password, count)
        return count

    except Exception as e:
        logger.warning(f"HIBP k-anonymity lookup failed: {e}")
        return -1


# ─── Internal cache helpers ──────────────────────────────────────────────────


def _cache_key(password: str) -> str:
    sha1 = hashlib.sha1(
        password.encode("utf-8"), usedforsecurity=False
    ).hexdigest().upper()
    return f"hibp_breach:{sha1}"


def _get_cached(password: str):
    try:
        from django.core.cache import cache
        return cache.get(_cache_key(password))
    except Exception:
        return None


def _set_cached(password: str, count: int) -> None:
    try:
        from django.core.cache import cache
        cache.set(_cache_key(password), count, _CACHE_TTL)
    except Exception:
        pass
