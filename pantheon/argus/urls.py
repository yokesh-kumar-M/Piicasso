from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .presentation.views import (
    GlobeDataView,
    HealthCheckView,
    MessageViewSet,
    NotificationViewSet,
    SimulatedTerminalView,
    SystemLogView,
    SystemLogViewSet,
    SystemSettingViewSet,
    admin_purge_all,
    admin_users_list,
    super_admin_view,
)

router = DefaultRouter()
router.register(r"logs", SystemLogViewSet, basename="system-logs")
router.register(r"messages", MessageViewSet, basename="messages")
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"settings", SystemSettingViewSet, basename="system-settings")

urlpatterns = [
    # Clean PascalCase & camelCase endpoints
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("analytics/globe/", GlobeDataView.as_view(), name="globe_data"),
    path("analyticsGlobe/", GlobeDataView.as_view(), name="globe_data_camel"),
    path("terminal/", SimulatedTerminalView.as_view(), name="simulated_terminal"),
    path("system/logs/", SystemLogView.as_view(), name="system_logs_alt"),
    path("systemLogs/", SystemLogView.as_view(), name="system_logs_camel"),
    path("admin/users/", admin_users_list, name="admin_users_list"),
    path("adminUsers/", admin_users_list, name="admin_users_camel"),
    path("admin/purge-all/", admin_purge_all, name="admin_purge_all"),
    path("admin/purgeall/", admin_purge_all, name="admin_purge_all_clean"),
    path("adminPurgeAll/", admin_purge_all, name="admin_purge_all_camel"),
    path("super-admin/", super_admin_view, name="super_admin_dashboard"),
    path("superadmin/", super_admin_view, name="super_admin_clean"),
    path("superAdmin/", super_admin_view, name="super_admin_camel"),
    # Direct router mount
    path("", include(router.urls)),
]
