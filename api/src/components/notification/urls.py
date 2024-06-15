# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('fetch-all-notifications/', views.user_notifications, name='fetch-notifications'),
]