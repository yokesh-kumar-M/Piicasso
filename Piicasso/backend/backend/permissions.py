"""
Enterprise permissions for PIIcasso.
Note: The default permission class is now `IsAuthenticated` (set in settings).
These are supplementary permission classes used explicitly on views.
"""
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class IsActiveUser(BasePermission):
    """Requires the user to be authenticated AND active."""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.is_active:
            raise PermissionDenied(
                detail='Your account has been suspended due to a policy violation.',
                code='user_inactive',
            )
        return True


class IsActiveUserOrMessagesOnly(BasePermission):
    """
    Allows inactive (suspended) users to access messaging endpoints only.
    Used explicitly on views that need this behaviour.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if not user.is_active:
            if request.path.startswith('/api/operations/messages/'):
                return True
            raise PermissionDenied(
                detail='Your account has been suspended due to a policy violation.',
                code='user_inactive',
            )
        return True


class IsSuperUser(BasePermission):
    """Restricts access to superusers only."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )
