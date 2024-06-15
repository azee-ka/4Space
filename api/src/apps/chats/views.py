# views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Message
from .serializers import ChatSerializer, MessageSerializer, UserChatSerializer, MessageBaseUserSerializer
from ...user.baseUser.models import BaseUser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat(request, username):
    user = request.user.interactuser
    other_user = get_user_by_username(username).interactuser

    if not other_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if a chat already exists between these participants
    existing_chat_1 = Chat.objects.filter(participants=user).filter(participants=other_user).distinct().first()
    existing_chat_2 = Chat.objects.filter(participants=other_user).filter(participants=user).distinct().first()

    if existing_chat_1 or existing_chat_2:
        # If a chat already exists, return information about the other user and chat id
        existing_chat = existing_chat_1 or existing_chat_2
        other_user_info = MessageBaseUserSerializer(other_user).data
        response_data = {
            "id": existing_chat.id,
            "other_user": other_user_info,
        }
        return Response(response_data, status=status.HTTP_200_OK)
    else:
        chat_serializer = ChatSerializer(data={})
        if chat_serializer.is_valid():
            chat_instance = chat_serializer.save()  # Save the chat instance first

            # Add participants to the chat
            chat_instance.participants.add(user, other_user)

            # Allow user to send messages to themselves
            if user == other_user:
                # Assume the user can only send messages to themselves
                chat_instance.participants.add(other_user)

            # Now serialize the other user's information and return the response
            other_user_info = MessageBaseUserSerializer(other_user).data
            response_data = {
                "chat_id": chat_instance.id,
                "other_user": other_user_info,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)




from rest_framework.pagination import LimitOffsetPagination

class MessagePagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 50

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_past_messages(request, chat_id):
    chat = get_object_or_404(Chat, pk=chat_id)
    paginator = MessagePagination()
    messages = Message.objects.filter(chat=chat).order_by('-timestamp')
    result_page = paginator.paginate_queryset(messages, request)
    serializer = MessageSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def list_past_messages(request, chat_id):
#     chat = get_object_or_404(Chat, pk=chat_id)
#     messages = Message.objects.filter(chat=chat)
#     serializer = MessageSerializer(messages, many=True)
#     return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_chats(request):
    user = request.user

    # Retrieve all chats where the user is a participant
    user_chats = Chat.objects.filter(participants=user)

    # Extract unique chat IDs from the queryset
    chat_ids = user_chats.values_list('id', flat=True)

    # Retrieve unique chats based on the extracted IDs
    unique_chats = Chat.objects.filter(id__in=chat_ids)

    # Use the new serializer for the user-specific chat listing
    serializer = UserChatSerializer(unique_chats, many=True, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_user_details(request, chat_id):
    try:
        chat = Chat.objects.get(pk=chat_id)
    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

    other_user = chat.participants.exclude(id=request.user.id).first()
    other_user_info = MessageBaseUserSerializer(other_user).data if other_user else None
    response_data = {
        "chat_id": chat.id,
        "other_user": other_user_info,
    }
    return Response(response_data, status=status.HTTP_200_OK)



def get_user_by_username(username):
    try:
        user = BaseUser.objects.get(username=username)
        return user
    except BaseUser.DoesNotExist:
        return None