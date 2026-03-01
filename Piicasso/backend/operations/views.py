from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer
from backend.permissions import IsActiveUserOrMessagesOnly

User = get_user_model()

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsActiveUserOrMessagesOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Message.objects.all()
        # Regular users only see messages where they are sender or recipient AND the other party is an admin
        return Message.objects.filter(
            Q(sender=user, recipient__is_superuser=True) | 
            Q(recipient=user, sender__is_superuser=True)
        )

    def perform_create(self, serializer):
        recipient = serializer.validated_data.get('recipient')
        
        # Enforce: Regular users can ONLY send to superusers
        if not self.request.user.is_superuser:
            if not recipient.is_superuser:
                # Silently or explicitly redirect to a superuser if they try to message a normal user
                admin_user = User.objects.filter(is_superuser=True).first()
                if admin_user:
                    serializer.save(sender=self.request.user, recipient=admin_user)
                else:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError("You can only message the system administrator.")
                return
        
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.recipient == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'marked as read'})
        return Response({'status': 'not authorized'}, status=status.HTTP_403_FORBIDDEN)
