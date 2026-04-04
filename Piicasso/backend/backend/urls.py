"""
PIIcasso Enterprise URL Configuration
======================================
Includes OpenAPI schema, Swagger UI, and ReDoc for API documentation.
API documentation requires admin authentication.
"""
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
    path('api/analytics/', include('analytics.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/password/', include('password_security.urls')),
    path('api/', include('wordgen.urls')),

    # Observability
    path('', include('django_prometheus.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
