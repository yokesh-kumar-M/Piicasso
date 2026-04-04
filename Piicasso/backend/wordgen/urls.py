from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, PiiSubmitView, HistoryView, delete_history_entry,
    download_wordlist, export_history_csv, download_report_pdf,
    user_profile, user_stats, admin_message_view, super_admin_view,
    admin_users_list, generate_download_token, download_file_with_token,
    SystemLogView, SimulatedTerminalView, health_check, get_cached_wordlist
)
from .auth_views import (
    MyTokenObtainPairView, GoogleLoginView, RequestPasswordResetView, VerifyResetOTPView
)

urlpatterns = [
    # Auth Endpoints
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/password/reset/', RequestPasswordResetView.as_view(), name='password_reset_request'),
    path('auth/password/reset/verify/', VerifyResetOTPView.as_view(), name='password_reset_verify'),

    path('health/', health_check),
    path('register/', RegisterView.as_view()),
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
    path('messages/', admin_message_view),
    path('super-admin/', super_admin_view),
    path('system/logs/', SystemLogView.as_view()),
    path('terminal/', SimulatedTerminalView.as_view()),
]
