"""
PIIcasso Enterprise URL Configuration
======================================
Includes OpenAPI schema, Swagger UI, and ReDoc for API documentation.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

# ─── Admin site customization ───────────────────────────────────────────────
admin.site.site_header = getattr(settings, 'ADMIN_SITE_HEADER', 'PIIcasso Command Center')
admin.site.site_title = getattr(settings, 'ADMIN_SITE_TITLE', 'PIIcasso Admin')
admin.site.index_title = getattr(settings, 'ADMIN_INDEX_TITLE', 'System Administration')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API documentation (Swagger / ReDoc / OpenAPI)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/analytics/', include('analytics.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/', include('wordgen.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
