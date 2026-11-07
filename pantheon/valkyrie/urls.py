from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .presentation.views import (
    BreachSearchView,
    PasswordAuditLogViewSet,
    PasswordScoreView,
    UserPreferenceView,
)

router = DefaultRouter()
router.register(r"audit", PasswordAuditLogViewSet, basename="password-audit")

urlpatterns = [
    # Clean PascalCase & camelCase endpoints
    path("score/", PasswordScoreView.as_view(), name="password_score"),
    path("breachSearch/", BreachSearchView.as_view(), name="breach_search_camel"),
    path("breachsearch/", BreachSearchView.as_view(), name="breach_search_clean"),
    path("breach-search/", BreachSearchView.as_view(), name="breach_search"),
    path("preference/", UserPreferenceView.as_view(), name="user_preference"),
    path("preferences/", UserPreferenceView.as_view(), name="user_preferences"),
    path("", include(router.urls)),
]
