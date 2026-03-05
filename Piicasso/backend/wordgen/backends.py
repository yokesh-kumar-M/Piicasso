from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password

User = get_user_model()

# Dummy password hash to use for timing-safe comparison when user doesn't exist
_DUMMY_HASH = make_password('dummy-password-for-timing-safety')


class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        if not username or not password:
            return None

        try:
            # Try to fetch the user by searching the username or email field
            user = User.objects.get(email=username) if '@' in username else User.objects.get(username=username)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            # Run the password hasher anyway to prevent timing-based user enumeration
            check_password(password, _DUMMY_HASH)
            return None
        return None
