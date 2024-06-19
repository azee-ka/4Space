from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_chat, name='create_chat'),
    path('<uuid:chat_uuid>/accept_chat_invitation/', views.accept_chat_invitation, name='accept_chat_invitation'),
    path('<uuid:chat_uuid>/reject_chat_invitation/', views.reject_chat_invitation, name='reject_chat_invitation'),
    path('<uuid:chat_uuid>/block_report_chat_invitation/', views.block_report_chat_invitation, name='block_report_chat_invitation'),
    path('<uuid:chat_uuid>/messages/', views.list_past_messages, name='list_past_messages'),
    path('list_user_chats/', views.list_user_chats, name='list_user_chats'),
    path('pending_received_list_chats/', views.pending_received_chat_invitations, name='pending_received_chat_invitations'),
    path('pending_sent_list_chats/', views.pending_sent_chat_invitations, name='pending_sent_chat_invitations'),
    path('<uuid:chat_uuid>/details/', views.get_chat_user_details, name='get_chat_user_details'),
]
