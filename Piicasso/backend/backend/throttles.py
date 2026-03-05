"""
Enterprise-grade rate throttle classes.
Configured rates live in settings.DEFAULT_THROTTLE_RATES.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Stricter throttle for login/token endpoints.
    Default: 5 requests per minute per IP.
    """
    scope = 'login'


class PiiSubmitRateThrottle(UserRateThrottle):
    """
    Stricter throttle for PII submission endpoints.
    Default: 10 requests per hour per user.
    """
    scope = 'pii_submit'


class BreachSearchRateThrottle(UserRateThrottle):
    """
    Throttle for breach search endpoint (5.7 fix).
    Prevents users from hammering HIBP and getting PIIcasso's IP rate-limited.
    Default: 3 requests per minute per user.
    """
    scope = 'breach_search'


class OTPVerifyRateThrottle(AnonRateThrottle):
    """
    Strict throttle for OTP verification to prevent brute force.
    Default: 5 requests per hour per IP.
    """
    scope = 'otp_verify'


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Throttle for password reset requests to prevent abuse.
    Default: 3 requests per hour per IP.
    """
    scope = 'password_reset'


class RegisterRateThrottle(AnonRateThrottle):
    """
    Throttle for registration to prevent mass account creation.
    Default: 5 requests per hour per IP.
    """
    scope = 'register'
