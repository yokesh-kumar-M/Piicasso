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
        return Message.objects.filter(Q(sender=user) | Q(recipient=user))

    def perform_create(self, serializer):
        recipient = serializer.validated_data.get('recipient')
        
        # If user is inactive blocked, force recipient to be an admin (e.g. Yokesh-superuser or any superuser)
        if not self.request.user.is_active:
            # They must only send to superusers
            if not recipient.is_superuser:
                admin_user = User.objects.filter(is_superuser=True).first()
                if admin_user:
                    serializer.save(sender=self.request.user, recipient=admin_user)
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
