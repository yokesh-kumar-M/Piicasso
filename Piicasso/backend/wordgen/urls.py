from django.urls import path
from .views.generation import (
    PiiSubmitView, HistoryView, delete_history_entry,
    download_wordlist, export_history_csv, download_report_pdf,
    user_profile, user_stats, generate_download_token,
    download_file_with_token, get_cached_wordlist,
)
from .views.admin import (
    admin_message_view, super_admin_view, admin_users_list, admin_purge_all,
)
from .views.system import SystemLogView, SimulatedTerminalView, health_check
from .auth_views import RequestPasswordResetView, VerifyResetOTPView

urlpatterns = [
    # Auth Endpoints are routed via core/urls.py
    # Password reset is exposed at /api/auth/... so it matches the URL the
    # frontend ForgotPasswordPage posts to (axios baseURL=/api/).
    path('auth/password/reset/', RequestPasswordResetView.as_view(), name='wordgen_password_reset_request'),
    path('auth/password/reset/verify/', VerifyResetOTPView.as_view(), name='wordgen_password_reset_verify'),

    path('health/', health_check),
    path('submit/', PiiSubmitView.as_view()),
    path('cached/<str:cache_key>/', get_cached_wordlist),
    path('history/', HistoryView.as_view()),
    path('history/<int:id>/', delete_history_entry),
    path('download/<int:id>/', download_wordlist),
    path('export/csv/', export_history_csv),
    path('report/pdf/<int:id>/', download_report_pdf),
    path('profile/', user_profile),
    path('stats/', user_stats),

    # 1.2 download token flow
    path('download-token/', generate_download_token),
    path('file/<str:file_type>/<int:id>/', download_file_with_token),

    # Admin / System
    path('admin/users/', admin_users_list),
    path('admin/purge-all/', admin_purge_all),
    path('messages/', admin_message_view),
    path('super-admin/', super_admin_view),
    path('system/logs/', SystemLogView.as_view()),
    path('terminal/', SimulatedTerminalView.as_view()),
]
