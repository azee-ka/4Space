# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('all-notifications/', views.user_notifications, name='fetch-notifications'),
    path('mark-as-read/<int:id>/', views.mark_notification_as_read, name='mark-as-read'),
    
    path('accept-follow-request/<int:notification_id>/', views.accept_follow_request, name='accept-follow-request'),
    path('reject-follow-request/<int:notification_id>/', views.reject_follow_request, name='reject-follow-request'),
    path('withdraw-follow-request/<int:recipient_id>/', views.withdraw_follow_request, name='withdraw-follow-request')
]