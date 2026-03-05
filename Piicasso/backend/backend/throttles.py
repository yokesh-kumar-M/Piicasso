"""
Enterprise-grade rate throttle classes.
Configured rates live in settings.DEFAULT_THROTTLE_RATES.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Stricter throttle for login/token endpoints.
    Default: 10 requests per minute per IP.
    """
    scope = 'login'


class PiiSubmitRateThrottle(UserRateThrottle):
    """
    Stricter throttle for PII submission endpoints.
    Default: 30 requests per hour per user.
    """
    scope = 'pii_submit'


class BreachSearchRateThrottle(UserRateThrottle):
    """
    Throttle for breach search endpoint (5.7 fix).
    Prevents users from hammering HIBP and getting PIIcasso's IP rate-limited.
    Default: 5 requests per minute per user.
    """
    scope = 'breach_search'
