import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from wordgen import routing
from wordgen.ws_auth import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # The SPA authenticates WebSockets with a SimpleJWT access token
    # (?token=...), so use the JWT middleware rather than the session-cookie
    # AuthMiddlewareStack. AllowedHostsOriginValidator blocks cross-origin WS.
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                routing.websocket_urlpatterns
            )
        )
    ),
})
