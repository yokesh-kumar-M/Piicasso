from django.urls import path
from .views import (
    RegisterView,
    MyTokenObtainPairView,
    GoogleLoginView,
    PingView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("ping/", PingView.as_view(), name="ping"),
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/google/", GoogleLoginView.as_view(), name="google_login"),
]
