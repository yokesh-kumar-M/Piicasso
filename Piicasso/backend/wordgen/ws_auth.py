"""
JWT authentication middleware for Channels (WebSocket).

The SPA authenticates with a SimpleJWT access token (sent as a ``?token=``
query parameter on the WebSocket URL), not a Django session cookie, so the
default ``AuthMiddlewareStack`` would always see an anonymous user here.
This middleware validates the access token and populates ``scope["user"]``.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _get_active_user(user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()
    return user if user.is_active else AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope["user"] = AnonymousUser()

        query = parse_qs((scope.get("query_string") or b"").decode())
        token_list = query.get("token") or []
        if token_list:
            try:
                from rest_framework_simplejwt.tokens import AccessToken

                access = AccessToken(token_list[0])  # validates signature + expiry
                user_id = access.get("user_id")
                if user_id is not None:
                    scope["user"] = await _get_active_user(user_id)
            except Exception:
                # Invalid/expired token → stay anonymous; the consumer rejects.
                scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
