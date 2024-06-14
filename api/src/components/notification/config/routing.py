# routing.py
from django.urls import path
from .consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/notifications/<int:id>/', NotificationConsumer.as_asgi()),
]
