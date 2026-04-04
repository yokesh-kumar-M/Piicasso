from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "service": "user_microservice"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/health/', health_check),
    path('api/user/password/', include('password_security.urls')),
    path('api/user/teams/', include('teams.urls')),
]
