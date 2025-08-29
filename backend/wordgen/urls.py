from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Import views from different modules
from .views import (
    PiiSubmitView,
    HistoryView,
    export_history_csv,
    download_wordlist,
    delete_history_entry,
)

from .views_auth import (
    RegisterView,
    CustomLoginView,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    check_verification_status,
    user_profile,
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification endpoints
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('check-verification/<str:email>/', check_verification_status, name='check_verification_status'),
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User profile
    path('profile/', user_profile, name='user_profile'),
    
    # PII and wordlist generation
    path('submit-pii/', PiiSubmitView.as_view(), name='submit_pii'),
    
    # History management
    path('history/', HistoryView.as_view(), name='history'),
    path('history/<int:id>/', delete_history_entry, name='delete_history_entry'),
    path('export-csv/', export_history_csv, name='export_csv'),
    path('download/<int:id>/', download_wordlist, name='download_wordlist'),
]