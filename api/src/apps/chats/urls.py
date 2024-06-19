# urls.py

from django.urls import path
from .views import create_chat, list_past_messages, list_user_chats, get_chat_user_details
from .config.views import save_message
from . import views

urlpatterns = [
    path('save_message/', save_message, name='save_message'),

    path('create/<str:username>/', views.create_chat, name='create-chat'),
    path('<int:chat_id>/messages/', views.list_past_messages, name='list-create-messages'),
    path('list-chats/', views.list_user_chats, name='list-user-chats'),
    path('pending-received-list-chats/', views.pending_received_chat_invitations, name='pending-received-list-user-chats'),
    path('pending-sent-list-chats/', views.pending_sent_chat_invitations, name='pending-sent-list-user-chats'),
    
    path('<int:chat_id>/', views.get_chat_user_details, name='get-chat-details'),
    
    path('accept-chat-invitation/<int:chat_id>/', views.accept_chat_invitation, name='accept_chat_invitation')
]
