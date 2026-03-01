from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

class IsActiveUserOrMessagesOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        if not user.is_active:
            if request.path.startswith('/api/operations/messages/'):
                return True
            raise PermissionDenied(detail='You have violeted the policy of website', code='user_inactive')
            
        return True
