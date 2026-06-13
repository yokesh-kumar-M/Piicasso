from django.conf import settings


def safe_float(val, default=999.0):
    try:
        return float(val) if val is not None and val != "" else default
    except (ValueError, TypeError):
        return default


def get_client_ip(request, trusted_proxy_count=None):
    """Best-effort client IP that resists X-Forwarded-For spoofing.

    Each proxy appends the address that connected to *it* to the right of
    X-Forwarded-For, so the left-most entries can be forged by the client.
    With a known number of trusted proxies in front of the app (Render = 1),
    the real client IP is the Nth entry counted from the right; anything a
    client prepends sits to the left and is ignored. Falls back to
    REMOTE_ADDR when no forwarded header is present.
    """
    if trusted_proxy_count is None:
        trusted_proxy_count = getattr(settings, "TRUSTED_PROXY_COUNT", 1)

    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            idx = min(len(parts), max(1, int(trusted_proxy_count)))
            candidate = parts[-idx]
            if candidate and len(candidate) <= 45:  # max IPv6 textual length
                return candidate
    return request.META.get("REMOTE_ADDR")
