from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MessageViewSet,
    NotificationListView,
    SystemSettingsView,
    BreachSearchView,
    FinancialRiskView,
)

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('settings/', SystemSettingsView.as_view(), name='system-settings'),
    path('breach-search/', BreachSearchView.as_view(), name='breach-search'),
    path('financial-risk/', FinancialRiskView.as_view(), name='financial-risk'),
]
