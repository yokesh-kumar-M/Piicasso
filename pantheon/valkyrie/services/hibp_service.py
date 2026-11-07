import hashlib
import logging

import requests
from django.core.cache import cache

logger = logging.getLogger("valkyrie.hibp")

_RANGE_URL = "https://api.pwnedpasswords.com/range/{prefix}"
_BREACH_URL = "https://haveibeenpwned.com/api/v3/breachedaccount/{account}"
_TIMEOUT = 10
_CACHE_TTL = 86400  # 24 hours


class HibpService:
    @staticmethod
    def _digest(password: str) -> str:
        return hashlib.sha1(password.encode("utf-8"), usedforsecurity=False).hexdigest().upper()

    @staticmethod
    def get_breach_count(password: str) -> int:
        sha1 = HibpService._digest(password)
        prefix, suffix = sha1[:5], sha1[5:]

        cache_key = f"valkyrie:hibp:{prefix}:{suffix}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            resp = requests.get(
                _RANGE_URL.format(prefix=prefix),
                headers={
                    "User-Agent": "PIIcasso-SecurityAudit/2.0",
                    "Add-Padding": "true",
                },
                timeout=_TIMEOUT,
            )
            if resp.status_code != 200:
                return -1

            count = 0
            for line in resp.text.splitlines():
                parts = line.strip().split(":")
                if len(parts) == 2 and parts[0].upper() == suffix:
                    count = int(parts[1])
                    break

            cache.set(cache_key, count, timeout=_CACHE_TTL)
            return count
        except Exception as exc:
            logger.warning("HIBP range lookup error: %s", exc)
            return -1

    @staticmethod
    def search_account_breaches(account: str, api_key: str = None) -> list:
        if not api_key:
            return []
        try:
            resp = requests.get(
                _BREACH_URL.format(account=account),
                headers={
                    "hibp-api-key": api_key,
                    "User-Agent": "PIIcasso-SecurityAudit/2.0",
                },
                params={"truncateResponse": "false"},
                timeout=_TIMEOUT,
            )
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 404:
                return []
            return []
        except Exception as exc:
            logger.warning("HIBP account search error: %s", exc)
            return []

