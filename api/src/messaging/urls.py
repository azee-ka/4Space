from django.urls import path
from . import views

urlpatterns = [
    path('create_conversation/', views.create_conversation, name='create_conversation'),
    path('list_conversations/', views.list_active_conversations, name='list_conversations'),
    path('list_conversations_requests/', views.list_invited_conversations, name='list_conversations'),
    
    path('get_conversation_details/<uuid:conversation_id>/', views.get_conversation_details, name='get_conversation_details'),
    path('get_messages/<uuid:conversation_id>/', views.get_messages, name='get_messages'),
    path('create_message/', views.create_message, name='create_message'),
    path('unsend_message/<uuid:message_id>/', views.unsend_message, name='unsend_message'),
    
    path('request/<uuid:conversation_id>/accept/', views.accept_invitation, name='accept_invitation'),
    path('request/<uuid:conversation_id>/reject/', views.reject_invitation, name='reject_invitation'),
    path('request/<uuid:conversation_id>/block/', views.block_user, name='block_user'),
    
    path('settings/', views.message_settings, name='message_settings'),
    
    path('upload_attachment/<uuid:message_uuid>/', views.upload_attachment, name='upload_attachment'),
    path('add_reaction/<uuid:message_uuid>/', views.add_reaction, name='add_reaction'),
    path('remove_reaction/<uuid:message_uuid>/<str:reaction_type>/', views.remove_reaction, name='remove_reaction'),

]
