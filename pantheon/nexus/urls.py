import os

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import IsAdminUser

from argus.presentation.views import HealthCheckView

# Admin site customization
admin.site.site_header = getattr(settings, "ADMIN_SITE_HEADER", "Pantheon Command Center")
admin.site.site_title = getattr(settings, "ADMIN_SITE_TITLE", "Pantheon Admin")
admin.site.index_title = getattr(settings, "ADMIN_INDEX_TITLE", "System Administration")


class ProtectedSchemaView(SpectacularAPIView):
    permission_classes = [IsAdminUser]


class ProtectedSwaggerView(SpectacularSwaggerView):
    permission_classes = [IsAdminUser]


class ProtectedRedocView(SpectacularRedocView):
    permission_classes = [IsAdminUser]


urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # OpenAPI Documentation
    path("api/schema/", ProtectedSchemaView.as_view(), name="schema"),
    path("api/docs/", ProtectedSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", ProtectedRedocView.as_view(url_name="schema"), name="redoc"),
    # Universal Health Check
    path("api/health/", HealthCheckView.as_view(), name="cluster_health"),
    # Cerberus (Identity, Auth, Teams)
    path("api/", include("cerberus.urls")),
    # Valkyrie (Password & Breach Security)
    path("api/password/", include("valkyrie.urls")),
    # Argus (Operations, Telemetry, Terminal, System, Admin)
    path("api/operations/", include("argus.urls")),
    path("api/", include("argus.urls")),
    # Golem (PII & Wordlist Generation Engine)
    path("api/", include("golem.urls")),
]

if settings.DEBUG or os.getenv("EXPOSE_PROMETHEUS") == "1":
    try:
        import django_prometheus.urls

        urlpatterns += [path("", include("django_prometheus.urls"))]
    except ImportError:
        pass

if settings.DEBUG:
    urlpatterns += [path("sentry-debug/", lambda request: 1 / 0)]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
