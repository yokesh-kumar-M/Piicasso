from django.urls import path
from .views import (
    RegisterView,
    PiiSubmitView,
    HistoryView,
    export_history_csv,
    download_wordlist,
    delete_history_entry,
)
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('submit-pii/', PiiSubmitView.as_view(), name='submit_pii'),
    path('history/', HistoryView.as_view(), name='history'),
    path('export-csv/', export_history_csv, name='export_csv'),
    path('download/<int:id>/', download_wordlist, name='download_wordlist'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('history/<int:id>/', delete_history_entry, name='delete_history_entry'),
]

