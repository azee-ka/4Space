# anonchat/routing.py
from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # matches ws://.../ws/anon-4chat/
    re_path(r"^ws/4chat/?$", ChatConsumer.as_asgi()),
]