from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Message, ChatParticipant
from .serializers import ChatSerializer, MessageSerializer, UserChatSerializer, MessageBaseUserSerializer, RestrictedChatSerializer, ChatParticipantSerializer
from ...user.baseUser.models import BaseUser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat(request):
    user = request.user.interactuser
    usernames = request.data.get('usernames', [])

    if not usernames:
        return Response({"error": "No participants specified"}, status=status.HTTP_400_BAD_REQUEST)

    participants = [user]
    for username in usernames:
        participant = get_user_by_username(username)
        if not participant:
            return Response({"error": f"User '{username}' not found"}, status=status.HTTP_404_NOT_FOUND)
        participants.append(participant.interactuser)

    # Find or create a chat with the exact set of participants
    participants_set = set(participants)
    existing_chats = Chat.objects.annotate(num_participants=Count('chatparticipant')).filter(num_participants=len(participants_set))

    for chat in existing_chats:
        chat_participants = set(chat.chatparticipant_set.all())
        if chat_participants == participants_set:
            response_data = {
                "uuid": chat.uuid,
                "participants": ChatParticipantSerializer(chat.chatparticipant_set.all(), many=True).data,
            }
            return Response(response_data, status=status.HTTP_200_OK)

    # Create a new chat
    chat = Chat.objects.create()
    chat.save()

    # Add participants to the chat
    for index, participant in enumerate(participants):
        is_inviter = index == 0  # Assuming the first participant is the inviter
        ChatParticipant.objects.create(chat=chat, participant=participant, is_inviter=is_inviter)

    response_data = {
        "uuid": chat.uuid,
        "participants": ChatParticipantSerializer(chat.chatparticipant_set.all(), many=True).data,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_chat_invitation(request, chat_uuid):
    user_id = request.user.id
    chat = get_object_or_404(Chat, uuid=chat_uuid)

    # Get or create the ChatParticipant object for the user in the chat
    participant, created = ChatParticipant.objects.get_or_create(chat=chat, participant_id=user_id, defaults={'accepted': True, 'restricted': False})

    # Update the user's status for this chat to mark it as accepted and unrestricted
    if not created:
        participant.accepted = True
        participant.restricted = False
        participant.save()

    # Get the channel layer
    channel_layer = get_channel_layer()

    # Add the user to the unrestricted group
    async_to_sync(channel_layer.group_add)(
        f'chat_{chat_uuid}_unrestricted',
        f'user_{user_id}'
    )
    
    return Response({"message": "Chat invitation accepted"}, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_chat_invitation(request, chat_uuid):
    user = request.user.interactuser
    chat = get_object_or_404(Chat, uuid=chat_uuid)

    # Remove the user from the chat participants
    ChatParticipant.objects.filter(chat=chat, participant=user).delete()

    # If there are no more participants, delete the chat
    if chat.chatparticipant_set.count() == 0:
        chat.delete()
        return Response({"message": "Chat deleted"}, status=status.HTTP_200_OK)

    return Response({"message": "Chat invitation rejected"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_report_chat_invitation(request, chat_uuid):
    user = request.user.interactuser
    chat = get_object_or_404(Chat, uuid=chat_uuid, chatparticipant__participant=user, chatparticipant__restricted=True)

    # Assuming there's a block model or method to handle blocking users
    other_user = chat.chatparticipant_set.exclude(participant=user).first()
    if other_user:
        # Block the other user
        user.blocked_users.add(other_user.participant)

    # Remove the user from the chat participants
    chat.chatparticipant_set.filter(participant=user).delete()

    # If there are no more participants, delete the chat
    if chat.chatparticipant_set.count() == 0:
        chat.delete()
        return Response({"message": "Chat deleted and user blocked"}, status=status.HTTP_200_OK)

    return Response({"message": "User blocked and chat invitation rejected"}, status=status.HTTP_200_OK)


class MessagePagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 50


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_past_messages(request, chat_uuid):
    chat = get_object_or_404(Chat, uuid=chat_uuid)
    user = request.user.interactuser

    # Check if the user is the inviter or has accepted the invitation
    is_inviter = ChatParticipant.objects.filter(chat=chat, participant=user, is_inviter=True).exists()
    is_accepted = ChatParticipant.objects.filter(chat=chat, participant=user, accepted=True).exists()
    is_restricted = ChatParticipant.objects.filter(chat=chat, participant=user, restricted=True).exists()

    # Get all messages if the user is the inviter or has accepted the invitation
    # Otherwise, get the first 3 messages
    if is_inviter or is_accepted or not is_restricted:
        messages = Message.objects.filter(chat=chat).order_by('timestamp')
        paginator = MessagePagination()
        result_page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    else:
        # Get the first 3 messages, assuming they are by the inviter or accepted users
        first_3_messages = Message.objects.filter(chat=chat).order_by('timestamp')[:3]

        # Initialize variables to keep track of messages to be sent
        messages_to_send = []
        if first_3_messages.count() > 0:
            first_message = first_3_messages[0]
            second_message = first_3_messages[1] if first_3_messages.count() > 1 else None
            third_message = first_3_messages[2] if first_3_messages.count() > 2 else None

            # Check if the first message is by the inviter
            is_inviter = ChatParticipant.objects.filter(chat=chat, participant=first_message.sender, is_inviter=True).exists()
            if is_inviter:
                messages_to_send.append(first_message)
                # Check if the second message is by the inviter
                if second_message and ChatParticipant.objects.filter(chat=chat, participant=second_message.sender, is_inviter=True).exists():
                    messages_to_send.append(second_message)
                    # Check if the third message is by the inviter
                    if third_message and ChatParticipant.objects.filter(chat=chat, participant=third_message.sender, is_inviter=True).exists():
                        messages_to_send.append(third_message)
            else:
                # If the first message is not by the inviter, send only the first message
                messages_to_send.append(first_message)

        paginator = MessagePagination()
        result_page = paginator.paginate_queryset(messages_to_send, request)
        serializer = MessageSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)






@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_chats(request):
    user = request.user.interactuser

    # Retrieve all chats where the user is a participant and the invitation is accepted
    user_chats = Chat.objects.filter(chatparticipant__participant=user, chatparticipant__restricted=False)

    # Extract unique chat UUIDs from the queryset
    chat_uuids = user_chats.values_list('uuid', flat=True)

    # Retrieve unique chats based on the extracted UUIDs
    unique_chats = Chat.objects.filter(uuid__in=chat_uuids)

    # Use the new serializer for the user-specific chat listing
    serializer = UserChatSerializer(unique_chats, many=True, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_received_chat_invitations(request):
    user = request.user.interactuser
    # Chats where the user is a participant and the chat has messages
    pending_invitations = Chat.objects.filter(chatparticipant__participant=user, chatparticipant__restricted=True).annotate(
        has_messages=Exists(Message.objects.filter(chat_id=OuterRef('id')))
    ).filter(has_messages=True).annotate(
        first_message_sender=Count('messages', filter=Q(messages__sender=user))
    ).filter(first_message_sender=0)
    serializer = UserChatSerializer(pending_invitations, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_sent_chat_invitations(request):
    user = request.user.interactuser
    # Chats where the user is a participant and the chat has messages
    pending_invitations = Chat.objects.filter(chatparticipant__participant=user, chatparticipant__restricted=True).annotate(
        has_messages=Exists(Message.objects.filter(chat_id=OuterRef('id')))
    ).filter(has_messages=True).annotate(
        first_message_sender=Count('messages', filter=Q(messages__sender=user))
    ).filter(first_message_sender__gt=0)
    serializer = UserChatSerializer(pending_invitations, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_user_details(request, chat_uuid):
    chat = get_object_or_404(Chat, uuid=chat_uuid)
    serializer = UserChatSerializer(chat, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


def get_user_by_username(username):
    try:
        user = BaseUser.objects.get(username=username)
        return user
    except BaseUser.DoesNotExist:
        return None
