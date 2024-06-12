# urls.py

from django.urls import path
from .views import create_chat, list_past_messages, list_user_chats, get_chat_user_details
from .config.views import save_message

urlpatterns = [
    path('save_message/', save_message, name='save_message'),

    path('create/<str:username>/', create_chat, name='create-chat'),
    path('<int:chat_id>/messages/', list_past_messages, name='list-create-messages'),
    path('list-chats/', list_user_chats, name='list-user-chats'),
    path('<int:chat_id>/', get_chat_user_details, name='get-chat-details'),
]
