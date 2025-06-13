from django.urls import path
from .consumers.chat_consumers import ChatConsumer
from .consumers.conversation_consumer import ConversationConsumer

websocket_urlpatterns = [
    path('ws/messages/conversations/', ConversationConsumer.as_asgi()),  # For conversation updates
    path('ws/messages/inbox/<str:conversation_id>/', ChatConsumer.as_asgi())
]