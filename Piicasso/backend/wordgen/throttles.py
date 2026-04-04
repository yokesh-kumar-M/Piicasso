from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class PIISubmitRateThrottle(UserRateThrottle):
    scope = 'pii_submit'

class BreachSearchRateThrottle(UserRateThrottle):
    scope = 'breach_search'

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'

class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'
