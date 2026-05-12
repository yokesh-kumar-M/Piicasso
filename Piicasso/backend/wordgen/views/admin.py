"""
Super-admin dashboard, messaging, and user management views.
"""

import logging

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, OuterRef, Subquery, Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from generator.models import GenerationHistory
from operations.models import SystemLog
from analytics.models import UserActivity

logger = logging.getLogger("wordgen")


# ─── SUPER ADMIN ─────────────────────────────────────────────────────────────


class SuperAdminView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if not request.user.is_superuser:
            self.permission_denied(
                request, message="Restricted entry. System Administrator ONLY."
            )

    def get(self, request):
        action = request.query_params.get("action")

        if action == "get_generations":
            target_id = request.query_params.get("user_id")
            if not target_id:
                return Response({"error": "user_id required."}, status=400)
            try:
                target_id = int(target_id)
            except (ValueError, TypeError):
                return Response({"error": "Invalid user_id."}, status=400)
            # Verify user exists
            if not User.objects.filter(id=target_id).exists():
                return Response({"error": "User not found."}, status=404)
            gens = list(
                GenerationHistory.objects.filter(user_id=target_id).select_related('user')
                .order_by("-timestamp")
                .values("id", "timestamp", "ip_address", "wordlist")[
                    :100
                ]  # Limit results
            )
            for g in gens:
                g["wordlist_count"] = len(g["wordlist"]) if g["wordlist"] else 0
                del g["wordlist"]
            return Response({"generations": gens})

        latest_activity_sq = (
            UserActivity.objects.filter(
                user=OuterRef("pk"),
                latitude__isnull=False,
            )
            .order_by("-timestamp")
            .values("city")[:1]
        )

        users_qs = User.objects.annotate(
            generated=Count("generation_history"),
            latest_city=Subquery(latest_activity_sq),
        ).order_by("-date_joined")

        users = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_superuser": u.is_superuser,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
                "location": u.latest_city or "Unknown",
                "pass_display": "External Auth (Google)"
                if not u.has_usable_password()
                else "Password Set",
                "generation_count": u.generated,
            }
            for u in users_qs
        ]

        logs = list(SystemLog.objects.all().order_by("-timestamp")[:50].values())
        activities = list(
            UserActivity.objects.all().order_by("-timestamp")[:50].values()
        )
        history_count = GenerationHistory.objects.count()

        return Response(
            {
                "users": users,
                "logs": logs,
                "activities": activities,
                "total_generations": history_count,
            }
        )

    def post(self, request):
        action = request.data.get("action")
        target_id = request.data.get("user_id")

        if not target_id:
            return Response({"error": "user_id required."}, status=400)

        try:
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user_id."}, status=400)

        try:
            target_user = User.objects.get(id=target_id)
            if target_user.is_superuser and action in (
                "block",
                "delete",
                "change_password",
            ):
                return Response(
                    {"error": "Admin Protection: Cannot modify another administrator."},
                    status=400,
                )
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if action == "promote_admin":
            if target_user == request.user:
                return Response({"error": "Cannot modify your own role."}, status=400)
            target_user.is_superuser = True
            target_user.is_staff = True
            target_user.save()
            return Response({"message": f"{target_user.username} promoted to administrator."})
        elif action == "demote_admin":
            if target_user == request.user:
                return Response({"error": "Cannot demote yourself."}, status=400)
            if User.objects.filter(is_superuser=True).count() <= 1:
                return Response({"error": "Cannot demote the last administrator."}, status=400)
            target_user.is_superuser = False
            target_user.is_staff = False
            target_user.save()
            return Response({"message": f"{target_user.username} demoted to standard user."})
        elif action == "block":
            target_user.is_active = False
            target_user.save()
            return Response(
                {"message": f"Operator {target_user.username} ACCESS BLOCKED."}
            )
        elif action == "unblock":
            target_user.is_active = True
            target_user.save()
            return Response(
                {"message": f"Operator {target_user.username} access restored."}
            )
        elif action == "change_password":
            new_pwd = request.data.get("new_password")
            if not new_pwd:
                return Response({"error": "new_password required."}, status=400)
            try:
                validate_password(new_pwd, user=target_user)
            except DjangoValidationError as e:
                return Response(
                    {"error": e.messages[0] if e.messages else "Password too weak."},
                    status=400,
                )
            target_user.set_password(new_pwd)
            target_user.save()
            # Invalidate all existing tokens for the target user
            try:
                from rest_framework_simplejwt.token_blacklist.models import (
                    OutstandingToken,
                    BlacklistedToken,
                )

                for token in OutstandingToken.objects.filter(user=target_user):
                    BlacklistedToken.objects.get_or_create(token=token)
            except Exception:
                pass
            return Response(
                {
                    "message": f"Security clearance for {target_user.username} manually overridden."
                }
            )

        return Response({"error": "Invalid action parameter."}, status=400)

    def delete(self, request):
        target_id = request.query_params.get("user_id")
        if not target_id:
            return Response({"error": "Provide user_id parameter."}, status=400)
        try:
            target_id = int(target_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid user_id."}, status=400)
        try:
            u = User.objects.get(id=target_id)
            if u.is_superuser:
                return Response(
                    {"error": "System Protection: Cannot delete an administrator."},
                    status=400,
                )
            username = u.username
            u.delete()
            return Response(
                {"message": f"User {username} and all their data eliminated."}
            )
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)


super_admin_view = SuperAdminView.as_view()


# ─── ADMIN MESSAGING (2.3 fix — optimized N+1 queries) ──────────────────────


@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_message_view(request):
    """
    Superuser: GET ?user_id= → thread; GET → user list with unread counts;
               POST {recipient_id, content} → send.
    Regular user: GET → admin conversation; POST {content} → reply to admin.
    """
    from operations.models import Message

    # Pagination limit for message threads (2.5 fix)
    MESSAGE_LIMIT = 200

    if request.user.is_superuser:
        if request.method == "GET":
            user_id = request.query_params.get("user_id")
            if not user_id:
                # Optimized: batch unread counts with annotation (2.3 fix)
                sent_ids = (
                    Message.objects.filter(recipient=request.user)
                    .values_list("sender_id", flat=True)
                    .distinct()
                )
                recv_ids = (
                    Message.objects.filter(sender=request.user)
                    .values_list("recipient_id", flat=True)
                    .distinct()
                )
                user_ids = set(list(sent_ids) + list(recv_ids)) - {request.user.id}

                users = User.objects.filter(id__in=user_ids).annotate(
                    unread_count=Count(
                        "sent_messages",
                        filter=Q(
                            sent_messages__recipient=request.user,
                            sent_messages__is_read=False,
                        ),
                    )
                )
                return Response(
                    [
                        {
                            "id": u.id,
                            "username": u.username,
                            "unread": u.unread_count,
                        }
                        for u in users
                    ]
                )

            msgs = Message.objects.filter(
                Q(sender=request.user, recipient_id=user_id)
                | Q(sender_id=user_id, recipient=request.user)
            ).order_by("-timestamp")[:MESSAGE_LIMIT]
            Message.objects.filter(
                sender_id=user_id, recipient=request.user, is_read=False
            ).update(is_read=True)
            return Response(
                [
                    {
                        "id": m.id,
                        "sender": m.sender.username,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat(),
                        "is_me": m.sender_id == request.user.id,
                        "is_read": m.is_read,
                    }
                    for m in msgs
                ]
            )

        recipient_id = request.data.get("recipient_id")
        content = request.data.get("content", "").strip()
        if not recipient_id or not content:
            return Response(
                {"error": "recipient_id and content are required."}, status=400
            )
        if len(content) > 2000:
            return Response(
                {"error": "Message too long (max 2000 characters)."}, status=400
            )
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        msg = Message.objects.create(
            sender=request.user, recipient=recipient, content=content
        )

        from operations.views import create_notification

        create_notification(
            user=recipient,
            notification_type="MESSAGE",
            title=f"New message from {request.user.username}",
            description=content[:100],
            link="/inbox",
        )

        return Response(
            {
                "id": msg.id,
                "sender": request.user.username,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "is_me": True,
            },
            status=201,
        )

    else:
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            return Response({"error": "No admin available."}, status=503)

        if request.method == "GET":
            msgs = Message.objects.filter(
                Q(sender=request.user, recipient=admin)
                | Q(sender=admin, recipient=request.user)
            ).order_by("-timestamp")[:MESSAGE_LIMIT]
            Message.objects.filter(
                sender=admin, recipient=request.user, is_read=False
            ).update(is_read=True)
            return Response(
                [
                    {
                        "id": m.id,
                        "sender": m.sender.username,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat(),
                        "is_me": m.sender_id == request.user.id,
                    }
                    for m in msgs
                ]
            )

        content = request.data.get("content", "").strip()
        if not content:
            return Response({"error": "Message cannot be empty."}, status=400)
        if len(content) > 2000:
            return Response(
                {"error": "Message too long (max 2000 characters)."}, status=400
            )
        msg = Message.objects.create(
            sender=request.user, recipient=admin, content=content
        )

        from operations.views import create_notification

        create_notification(
            user=admin,
            notification_type="MESSAGE",
            title=f"New message from {request.user.username}",
            description=content[:100],
            link=f"/inbox?recipient={request.user.id}",
        )

        return Response(
            {
                "id": msg.id,
                "sender": request.user.username,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "is_me": True,
            },
            status=201,
        )


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Superuser-only: list all users for admin to select and message."""
    if not request.user.is_superuser:
        return Response({"error": "Access denied."}, status=403)
    users = (
        User.objects.filter(is_superuser=False)
        .order_by("username")
        .values("id", "username", "email", "is_active")
    )
    return Response(list(users))
