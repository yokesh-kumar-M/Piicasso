from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .presentation.views import (
    GoogleLoginView,
    MyTokenObtainPairView,
    PingView,
    RegisterView,
    RequestPasswordResetView,
    TeamMessageViewSet,
    TeamViewSet,
    VerifyResetOTPView,
)

router = DefaultRouter()
router.register(r"teams/messages", TeamMessageViewSet, basename="team-messages")
router.register(r"teams", TeamViewSet, basename="teams")

urlpatterns = [
    path("user/ping/", PingView.as_view(), name="ping"),
    path("user/register/", RegisterView.as_view(), name="register"),
    path("user/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("user/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("user/auth/google/", GoogleLoginView.as_view(), name="google_login"),
    path("user/auth/password/reset/", RequestPasswordResetView.as_view(), name="password_reset_request"),
    path("user/auth/password/reset/verify/", VerifyResetOTPView.as_view(), name="password_reset_verify"),
    # Also expose auth password reset at root api/auth/ for frontend compatibility
    path("auth/password/reset/", RequestPasswordResetView.as_view(), name="root_password_reset_request"),
    path("auth/password/reset/verify/", VerifyResetOTPView.as_view(), name="root_password_reset_verify"),
    # Teams endpoints
    path("", include(router.urls)),
]

