from django.urls import path
from .views import (
    PasswordAnalyzeView, 
    PasswordAnalysisHistoryView, 
    UserPreferencesView,
    check_password_breach,
    UserActivityFeedView
)

urlpatterns = [
    path('analyze/', PasswordAnalyzeView.as_view(), name='password-analyze'),
    path('history/', PasswordAnalysisHistoryView.as_view(), name='password-history'),
    path('preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    path('breach-check/', check_password_breach, name='breach-check'),
    path('activity/', UserActivityFeedView.as_view(), name='user-activity'),
]
