# src/messaging/4chat/urls.py
from django.contrib import admin
from django.urls import path
from . import views as chat_views

urlpatterns = [
    path("health/", chat_views.health),
    path("sessions/", chat_views.list_sessions),
    path("sessions/<uuid:session_id>/messages/", chat_views.list_session_messages),
    path("report/", chat_views.submit_report),
]