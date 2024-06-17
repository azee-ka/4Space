# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('all-notifications/', views.user_notifications, name='fetch-notifications'),
    path('mark-as-read/<int:id>/', views.mark_notification_as_read, name='mark-as-read'),
]