"""
PIIcasso Enterprise URL Configuration
======================================
Includes OpenAPI schema, Swagger UI, and ReDoc for API documentation.
API documentation requires admin authentication.
"""
import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.permissions import IsAdminUser

# ─── Admin site customization ───────────────────────────────────────────────
admin.site.site_header = getattr(settings, 'ADMIN_SITE_HEADER', 'PIIcasso Command Center')
admin.site.site_title = getattr(settings, 'ADMIN_SITE_TITLE', 'PIIcasso Admin')
admin.site.index_title = getattr(settings, 'ADMIN_INDEX_TITLE', 'System Administration')


# Wrap spectacular views to require admin auth
class ProtectedSchemaView(SpectacularAPIView):
    permission_classes = [IsAdminUser]

class ProtectedSwaggerView(SpectacularSwaggerView):
    permission_classes = [IsAdminUser]

class ProtectedRedocView(SpectacularRedocView):
    permission_classes = [IsAdminUser]


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API documentation (Swagger / ReDoc / OpenAPI) — admin only
    path('api/schema/', ProtectedSchemaView.as_view(), name='schema'),
    path('api/docs/', ProtectedSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', ProtectedRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/user/', include('core.urls')),
    path('api/password/', include('password_security.urls')),
    path('api/teams/', include('teams.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/', include('wordgen.urls')),
]

# Observability — /metrics must not be public; only mount when DEBUG or
# when EXPOSE_PROMETHEUS=1 is set (and front it with an auth proxy / IP allow-list).
if settings.DEBUG or os.getenv('EXPOSE_PROMETHEUS') == '1':
    urlpatterns += [path('', include('django_prometheus.urls'))]

# Sentry verification route — DEBUG-only so it cannot be abused as a free 500 generator in prod.
if settings.DEBUG:
    urlpatterns += [path('sentry-debug/', lambda request: 1 / 0)]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
