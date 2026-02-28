from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .auth_views import MyTokenObtainPairView, GoogleLoginView, RequestPasswordResetView, VerifyResetOTPView
from .views import (
    RegisterView,
    PiiSubmitView,
    HistoryView,
    export_history_csv,
    download_wordlist,
    delete_history_entry,
    download_dossier_pdf,
    user_stats,
    create_squadron,
    join_squadron,
    get_squadron_info,
    leave_squadron,
    SystemLogView,
    ThreatMapView,
    TerminalExecView,
    beacon_view,
    SuperAdminView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('submit-pii/', PiiSubmitView.as_view(), name='submit_pii'),
    path('history/', HistoryView.as_view(), name='history'),
    path('history/<int:id>/', delete_history_entry, name='delete_history_entry'),
    path('export-csv/', export_history_csv, name='export_csv'),
    path('download/<int:id>/', download_wordlist, name='download_wordlist'),
    path('pdf/<int:id>/', download_dossier_pdf, name='download_dossier_pdf'),
    path('stats/', user_stats, name='user_stats'),
    path('squadron/', get_squadron_info, name='squadron_info'),
    path('squadron/create/', create_squadron, name='create_squadron'),
    path('squadron/join/', join_squadron, name='join_squadron'),
    path('squadron/leave/', leave_squadron, name='leave_squadron'),
    
    # Real-time / Simulation endpoints
    path('system-logs/', SystemLogView.as_view(), name='system_logs'),
    path('map-data/', ThreatMapView.as_view(), name='map_data'),
    path('terminal/exec/', TerminalExecView.as_view(), name='terminal_exec'),
    path('beacon/', beacon_view, name='beacon_view'),

    # JWT endpoints
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    
    # Password Reset endpoints
    path('auth/request-reset/', RequestPasswordResetView.as_view(), name='request_reset'),
    path('auth/verify-reset/', VerifyResetOTPView.as_view(), name='verify_reset'),
    
    # ULTIMATE ADMIN ROUTE
    path('admin/ultimate/', SuperAdminView.as_view(), name='super_admin'),
]
