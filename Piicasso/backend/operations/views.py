from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from django.db.models import Q
import html as html_module
import re
from .models import Message, Notification, SystemSetting
from .serializers import (
    MessageSerializer,
    NotificationSerializer,
    SystemSettingSerializer,
)
from backend.permissions import IsActiveUserOrMessagesOnly
from password_security.hibp import k_anonymity_breach_count

User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsActiveUserOrMessagesOnly]
    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]  # Disable PUT/PATCH/DELETE on messages

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Message.objects.select_related("sender", "recipient").all()
        return Message.objects.select_related("sender", "recipient").filter(
            Q(sender=user, recipient__is_superuser=True)
            | Q(recipient=user, sender__is_superuser=True)
        )

    def perform_create(self, serializer):
        # Sanitize content to prevent stored XSS
        content = serializer.validated_data.get("content", "")
        if len(content) > 2000:
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Message too long (max 2000 characters).")
        sanitized_content = html_module.escape(content, quote=True)

        recipient = serializer.validated_data.get("recipient")

        if not self.request.user.is_superuser:
            if not recipient or not recipient.is_superuser:
                admin_user = User.objects.filter(is_superuser=True).first()
                if admin_user:
                    serializer.save(
                        sender=self.request.user,
                        recipient=admin_user,
                        content=sanitized_content,
                    )
                else:
                    from rest_framework.exceptions import ValidationError

                    raise ValidationError(
                        "You can only message the system administrator."
                    )
                return

        if not recipient:
            from rest_framework.exceptions import ValidationError

            raise ValidationError("Recipient is required.")

        serializer.save(sender=self.request.user, content=sanitized_content)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.recipient == request.user:
            message.is_read = True
            message.save()
            return Response({"status": "marked as read"})
        return Response({"status": "not authorized"}, status=status.HTTP_403_FORBIDDEN)


class NotificationListView(APIView):
    """Get notifications for the current user, mark as read, mark all as read."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by(
            "-timestamp"
        )[:50]
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        serializer = NotificationSerializer(notifications, many=True)
        return Response(
            {
                "notifications": serializer.data,
                "unread_count": unread_count,
            }
        )

    def post(self, request):
        """Mark notification(s) as read."""
        action_type = request.data.get("action")

        if action_type == "mark_all_read":
            Notification.objects.filter(user=request.user, is_read=False).update(
                is_read=True
            )
            return Response({"message": "All notifications marked as read."})

        notification_id = request.data.get("id")
        if notification_id:
            try:
                notif = Notification.objects.get(id=notification_id, user=request.user)
                notif.is_read = True
                notif.save()
                return Response({"message": "Notification marked as read."})
            except Notification.DoesNotExist:
                return Response({"error": "Notification not found."}, status=404)

        return Response({"error": "Invalid action."}, status=400)

    def delete(self, request):
        """Clear all notifications for the user."""
        Notification.objects.filter(user=request.user).delete()
        return Response({"message": "All notifications cleared."}, status=204)


class SystemSettingsView(APIView):
    """Admin-only system configuration endpoint."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    # Whitelist of allowed setting keys
    ALLOWED_KEYS = frozenset(
        [
            "maintenance_mode",
            "registration_enabled",
            "max_wordlist_size",
            "data_retention_days",
            "announcement",
            "strict_security",
            "generation_speed",
        ]
    )

    def get(self, request):
        """Get all system settings."""
        if not request.user.is_superuser:
            return Response({"error": "Admin access required."}, status=403)

        settings = SystemSetting.objects.all()
        serializer = SystemSettingSerializer(settings, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Update a system setting."""
        if not request.user.is_superuser:
            return Response({"error": "Admin access required."}, status=403)

        key = request.data.get("key", "").strip()
        value = request.data.get("value", "").strip()
        description = request.data.get("description", "")

        if not key:
            return Response({"error": "Setting key is required."}, status=400)

        # Validate key against whitelist
        if key not in self.ALLOWED_KEYS:
            return Response(
                {
                    "error": f"Invalid setting key. Allowed: {', '.join(sorted(self.ALLOWED_KEYS))}"
                },
                status=400,
            )

        # Validate value length
        if len(value) > 500:
            return Response(
                {"error": "Setting value too long (max 500 characters)."}, status=400
            )

        setting = SystemSetting.set(
            key, value, user=request.user, description=description
        )

        # Log the change
        from .models import SystemLog

        SystemLog.objects.create(
            message=f"Setting '{key}' updated by admin", level="INFO", source="ADMIN"
        )

        return Response(
            {
                "key": setting.key,
                "value": setting.value,
                "message": f'Setting "{key}" updated successfully.',
            }
        )

    def delete(self, request):
        """Delete a system setting."""
        if not request.user.is_superuser:
            return Response({"error": "Admin access required."}, status=403)

        key = request.data.get("key")
        if not key:
            return Response({"error": "Setting key is required."}, status=400)

        try:
            setting = SystemSetting.objects.get(key=key)
            setting.delete()
            return Response({"message": f'Setting "{key}" deleted.'}, status=204)
        except SystemSetting.DoesNotExist:
            return Response({"error": "Setting not found."}, status=404)


class BreachSearchView(APIView):
    """
    Search for data breaches using the Have I Been Pwned API
    and internal generation history.

    NOTE (5.5): The /api/v3/breachedaccount/ endpoint requires a paid HIBP API key.
    Set the HIBP_API_KEY environment variable to enable email breach lookups.
    Without it, only the free password hash endpoint (k-anonymity) works.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        from backend.throttles import BreachSearchRateThrottle

        return [BreachSearchRateThrottle()]

    def post(self, request):
        import requests as http_requests

        query = request.data.get("query", "").strip()
        if not query:
            return Response({"error": "Search query is required."}, status=400)

        # Validate query length and content
        if len(query) > 254:
            return Response(
                {"error": "Query too long (max 254 characters)."}, status=400
            )

        # Validate email format for HIBP lookup
        if "@" in query and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", query):
            return Response({"error": "Invalid email format."}, status=400)
        # Prevent injection in URL path
        if any(c in query for c in ["\n", "\r", "\x00", "/", "\\", "..", "<", ">"]):
            return Response({"error": "Invalid characters in query."}, status=400)

        results = {
            "breaches": [],
            "password_exposures": 0,
            "internal_matches": 0,
            "query": query,
        }

        # 1. Check HIBP Breaches API for email
        if "@" in query:
            hibp_api_key = __import__("os").environ.get("HIBP_API_KEY", "")
            if hibp_api_key:
                try:
                    headers = {
                        "User-Agent": "PIIcasso-SecurityAudit",
                        "hibp-api-key": hibp_api_key,
                    }
                    resp = http_requests.get(
                        "https://haveibeenpwned.com/api/v3/breachedaccount/",
                        params={"truncateResponse": "true", "account": query},
                        headers=headers,
                        timeout=10,
                    )
                    if resp.status_code == 200:
                        breach_data = resp.json()
                        for breach in breach_data:
                            results["breaches"].append(
                                {
                                    "name": breach.get("Name", "Unknown"),
                                    "domain": breach.get("Domain", "N/A"),
                                    "breach_date": breach.get("BreachDate", "N/A"),
                                    "data_classes": breach.get("DataClasses", []),
                                    "is_verified": breach.get("IsVerified", False),
                                    "description": breach.get("Description", ""),
                                }
                            )
                    elif resp.status_code == 404:
                        pass  # No breaches found — good news
                    elif resp.status_code == 429:
                        results["rate_limited"] = True
                except Exception as e:
                    results["hibp_error"] = "Breach lookup temporarily unavailable."
            else:
                # No HIBP API key configured — skip email breach lookup
                results["hibp_note"] = (
                    "Email breach lookup requires HIBP API key configuration."
                )

        # 2. Check HIBP Passwords API using k-anonymity (SHA-1 prefix)
        # This checks if the query itself (as a password) has been exposed.
        # k_anonymity_breach_count() only sends the first 5 hex chars to HIBP.
        exposure_count = k_anonymity_breach_count(query)
        if exposure_count >= 0:
            results["password_exposures"] = exposure_count

        # 3. Check internal generation history (restricted to user's own data for non-admins)
        # Note: pii_data is EncryptedJSONField — cannot search encrypted fields.
        # Count is always 0 for encrypted-field searches; removed invalid lookups.
        results["internal_matches"] = 0

        # Calculate risk score
        breach_count = len(results["breaches"])
        risk_score = min(
            100,
            (breach_count * 15)
            + (min(results["password_exposures"], 100) * 0.5)
            + (results["internal_matches"] * 5),
        )
        results["risk_score"] = round(risk_score)

        # Create notification for the user (truncate query for safety)
        safe_display = query[:20] + ("..." if len(query) > 20 else "")
        Notification.objects.create(
            user=request.user,
            notification_type="SECURITY",
            title=f"Breach scan completed",
            description=f"Found {breach_count} breaches, {results['password_exposures']} password exposures.",
            link="/darkweb",
        )

        return Response(results)


# Helper function to create notifications from anywhere in the codebase
def create_notification(user, notification_type, title, description="", link=""):
    """Utility to create a notification for a user. Content is HTML-escaped."""
    import html as _html

    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=_html.escape(str(title)[:200], quote=True),
        description=_html.escape(str(description)[:500], quote=True),
        link=link[:255] if link else "",
    )
