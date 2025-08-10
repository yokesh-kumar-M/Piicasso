from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    PiiSubmitView,
    HistoryView,
    export_history_csv,
    download_wordlist,
    delete_history_entry,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('submit-pii/', PiiSubmitView.as_view(), name='submit_pii'),
    path('history/', HistoryView.as_view(), name='history'),
    path('history/<int:id>/', delete_history_entry, name='delete_history_entry'),
    path('export-csv/', export_history_csv, name='export_csv'),
    path('download/<int:id>/', download_wordlist, name='download_wordlist'),
    # JWT endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
