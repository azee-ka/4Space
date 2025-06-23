from django.urls import path
from . import views

urlpatterns = [
    path('profile/follow-toggle/<str:username>/', views.toggle_follow, name='toggle_follow'),
    path('profile/resolve-follow-request/<str:requester_id>/', views.resolve_follow_request, name='resolve_follow_request'),
]
