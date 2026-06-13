"""
Deprecated shim. All throttle classes now live in ``backend.throttles`` —
this module re-exports them so any lingering imports keep working. Import
from ``backend.throttles`` directly in new code.
"""
from backend.throttles import (  # noqa: F401
    LoginRateThrottle,
    PiiSubmitRateThrottle,
    BreachSearchRateThrottle,
    OTPVerifyRateThrottle,
    PasswordResetRateThrottle,
    RegisterRateThrottle,
    TerminalRateThrottle,
)

# Backward-compatible alias (old name used the all-caps spelling).
PIISubmitRateThrottle = PiiSubmitRateThrottle
