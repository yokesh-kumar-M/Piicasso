from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Stricter throttle for login/token endpoints.
    Rate is configured via DEFAULT_THROTTLE_RATES['login'] in settings.py.
    Default: 10 requests per minute per IP.
    """
    scope = 'login'
