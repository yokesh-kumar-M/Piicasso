from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .auth_views import MyTokenObtainPairView, GoogleLoginView, RequestPasswordResetView, VerifyResetOTPView
from .views import (
    RegisterView,
    PiiSubmitView,
    HistoryView,
    export_history_csv,
    download_wordlist,
    delete_history_entry,
    download_report_pdf,
    user_stats,
    user_profile,
    generate_download_token,
    download_file_with_token,
    SimulatedTerminalView,
    SystemLogView,
    beacon_view,
    super_admin_view,
    health_check,
    admin_message_view,
    admin_users_list,
)

urlpatterns = [
    # Health check
    path('health/', health_check, name='health'),

    # Authentication
    path('token/', MyTokenObtainPairView.as_view(), name='token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/request-reset/', RequestPasswordResetView.as_view(), name='request_reset'),
    path('auth/verify-reset/', VerifyResetOTPView.as_view(), name='verify_reset'),

    # User operations
    path('register/', RegisterView.as_view(), name='register'),
    path('submit/', PiiSubmitView.as_view(), name='submit'),
    path('history/', HistoryView.as_view(), name='history'),
    path('history/<int:id>/', delete_history_entry, name='delete_history'),
    path('history/export/', export_history_csv, name='export_csv'),
    path('download/<int:id>/', download_wordlist, name='download_wordlist'),
    path('report/<int:id>/', download_report_pdf, name='download_report'),
    path('stats/', user_stats, name='stats'),
    path('profile/', user_profile, name='profile'),

    # File downloads — signed token flow (1.2 fix)
    path('download-token/', generate_download_token, name='generate_download_token'),
    path('file/<str:file_type>/<int:id>/', download_file_with_token, name='download_file'),

    # Teams (Delegated to teams/urls.py)
    path('teams/', include('teams.urls')),

    # Admin messaging (superuser only)
    path('admin/messages/', admin_message_view, name='admin_messages'),
    path('admin/users/', admin_users_list, name='admin_users'),

    # System
    path('terminal/', SimulatedTerminalView.as_view(), name='terminal'),
    path('logs/', SystemLogView.as_view(), name='logs'),
    path('beacon/', beacon_view, name='beacon'),
    path('admin/', super_admin_view, name='admin'),
]
