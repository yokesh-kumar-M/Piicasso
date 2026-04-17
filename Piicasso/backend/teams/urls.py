from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_team_info, name='team_info'),
    path('create/', views.create_team, name='create_team'),
    path('join/', views.join_team, name='join_team'),
    path('leave/', views.leave_team, name='leave_team'),
    path('chat/', views.team_chat_messages, name='team_chat'),
]
