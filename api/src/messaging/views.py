from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ObjectDoesNotExist
from django.utils.timezone import now
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from ..user.models import BaseUser
from .models import Conversation, Message, Attachment, MessageSettings, Participant, Reaction
from .serializers import ConversationSerializer, MessageSerializer, ConversationListSerializer, AttachmentSerializer, ReactionSerializer
from rest_framework.pagination import LimitOffsetPagination
import uuid



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_reaction(request, message_uuid):
    """
    Expect JSON: { "reaction_type": "like" }
    """
    reaction_type = request.data.get('reaction_type')
    if reaction_type not in dict(Reaction.REACTION_CHOICES):
        return Response({'error': 'Invalid reaction_type.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        message = Message.objects.get(uuid=message_uuid)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    reaction, created = Reaction.objects.get_or_create(
        message=message,
        user=request.user,
        reaction_type=reaction_type
    )
    if not created:
        return Response({'detail': 'Reaction already exists.'}, status=status.HTTP_200_OK)

    serializer = ReactionSerializer(reaction)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_reaction(request, message_uuid, reaction_type):
    """
    URL: /remove_reaction/<message_uuid>/<reaction_type>/
    """
    try:
        message = Message.objects.get(uuid=message_uuid)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        reaction = Reaction.objects.get(
            message=message,
            user=request.user,
            reaction_type=reaction_type
        )
    except Reaction.DoesNotExist:
        return Response({'error': 'Reaction not found.'}, status=status.HTTP_404_NOT_FOUND)

    reaction.delete()
    return Response({'detail': 'Reaction removed.'}, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_attachment(request, message_uuid):
    """
    Upload one or more files for a message. Expects: files in request.FILES.getlist('files')
    """
    try:
        message = Message.objects.get(uuid=message_uuid)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Only the message sender can attach files
    if message.sender != request.user:
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    files = request.FILES.getlist('files')
    if not files:
        return Response({'error': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)

    attachments = []
    for f in files:
        mime = f.content_type
        attachment = Attachment.objects.create(message=message, file=f, mime_type=mime)
        attachments.append(attachment)

    serializer = AttachmentSerializer(attachments, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request, conversation_id):
    """
    Accept an invitation to a conversation.
    """
    participant = get_object_or_404(Participant, conversation__uuid=conversation_id, user=request.user)

    if participant.status != 'invited':
        return Response({'error': 'You can only accept an invitation if you are invited.'}, status=status.HTTP_400_BAD_REQUEST)

    participant.status = 'active'
    participant.invitation_accepted_at = now()
    participant.save()
    
    conversation = participant.conversation
    conversation.conversation_status = 'allowed'
    conversation.save()

    return Response({'message': 'Invitation accepted successfully.', 'view_type': 'inbox'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_invitation(request, conversation_id):
    """
    Reject an invitation to a conversation.
    """
    participant = get_object_or_404(Participant, conversation__uuid=conversation_id, user=request.user)

    if participant.status != 'invited':
        return Response({'error': 'You can only reject an invitation if you are invited.'}, status=status.HTTP_400_BAD_REQUEST)

    participant.status = 'added'  # Change status to 'added' after rejecting
    participant.invitation_declined_at = now()
    participant.save()

    return Response({'message': 'Invitation rejected successfully.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request, conversation_id):
    """
    Block a user in a conversation.
    """
    participant = get_object_or_404(Participant, conversation__uuid=conversation_id, user=request.user)

    if participant.status == 'blocked':
        return Response({'error': 'User is already blocked.'}, status=status.HTTP_400_BAD_REQUEST)

    participant.status = 'blocked'
    participant.save()

    return Response({'message': 'User blocked successfully.'}, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """
    - Accepts request.data = { "recipients": [ { "id": <int> }, ... ] }
    - Builds a deduped list of (request.user.id + all those recipient IDs).
      If any ID is invalid, return 400. Otherwise, if a Conversation with exactly
      that same set already exists, return its UUID. Otherwise, create a new one.
    """
    raw_recipients = request.data.get('recipients', [])

    # 1) Pull out integer IDs from each object, error if missing/invalid
    recipient_ids = []
    for r in raw_recipients:
        if not isinstance(r, dict) or 'id' not in r:
            return Response(
                {"error": "Each recipient must be an object with an 'id' key."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            rid = str(r['id'])
            uuid_obj = uuid.UUID(rid)  # Will raise ValueError if not a valid UUID
        except (TypeError, ValueError, AttributeError):
            return Response(
                {"error": f"Invalid recipient ID: {r.get('id')}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        recipient_ids.append(rid)

    # 2) Dedupe and remove any occurrence of the current user’s own ID
    unique_recipient_ids = sorted(set(recipient_ids) - {request.user.id})

    # 3) Now build the final sorted list of all participants (no duplicates)
    all_user_ids = [request.user.id] + unique_recipient_ids

    # 4) Verify that each ID actually exists in the User table
    users = BaseUser.objects.filter(id__in=all_user_ids)
    if users.count() != len(all_user_ids):
        return Response(
            {"error": "One or more recipients are invalid."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 5) Look for any conversation whose participants exactly match this set
    possible_convos = Conversation.objects.annotate(
        total_participants=Count('participant_records'),
        matched_participants=Count(
            'participant_records',
            filter=Q(participant_records__user__id__in=all_user_ids)
        )
    ).filter(
        total_participants=len(all_user_ids),
        matched_participants=len(all_user_ids)
    )

    if possible_convos.exists():
        existing_convo = possible_convos.first()
        return Response({
            "message": "A conversation with these participants already exists.",
            "conversation_uuid": existing_convo.uuid,
            "existing": True
        }, status=status.HTTP_200_OK)

    # 6) Otherwise, create a fresh conversation
    conversation = Conversation.objects.create()

    # 6a) Add the creator as “active”
    Participant.objects.create(
        user=request.user,
        conversation=conversation,
        role='creator',
        status='active'
    )

    # 6b) Add each other user as “member”
    for u in users:
        if u.id == request.user.id:
            continue
        Participant.objects.create(
            user=u,
            conversation=conversation,
            role='member',
            status='added'
        )

    return Response({
        "conversation_uuid": conversation.uuid,
        "existing": False
    }, status=status.HTTP_201_CREATED)







@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_active_conversations(request):
    """
    Get a list of all active conversations for the current user.
    """
    # Get the conversations from the filtered participants
    conversations = Conversation.objects.filter(participant_records__user=request.user,
                                            participant_records__status='active')
    # Serialize the conversations
    serializer = ConversationListSerializer(conversations, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_invited_conversations(request):
    """
    Get a list of all invited conversations for the current user.
    """
    conversations = Conversation.objects.filter(participant_records__user=request.user,
                                            participant_records__status='invited')
    serializer = ConversationListSerializer(conversations, many=True, context={'request': request})
    return Response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_details(request, conversation_id):
    """
    Get the details of a specific conversation, excluding the current user from participants.
    """
    conversation = get_object_or_404(
        Conversation,
        uuid=conversation_id,
        participant_records__user=request.user  # Correct related name for Participant
    )
    serializer = ConversationSerializer(conversation, context={'request': request})
    return Response(serializer.data)





@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    conversation = get_object_or_404(
        Conversation,
        uuid=conversation_id,
        participant_records__user=request.user
    )
    qs = conversation.messages.order_by('-sent_at')
    paginator = LimitOffsetPagination()
    paginated = paginator.paginate_queryset(qs, request)
    serializer = MessageSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)









@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_message(request):
    """
    Create a new message in an existing conversation.

    If request.data contains "parent_message_uuid", we associate the new message to that parent.
    """
    data = request.data
    conversation = get_object_or_404(
        Conversation,
        uuid=data.get('conversation'),
        participant_records__user=request.user
    )

    parent_uuid = data.get('parent_message_uuid')
    parent = None
    if parent_uuid:
        try:
            parent = Message.objects.get(uuid=parent_uuid)
            # we could verify parent.conversation == conversation if desired
        except Message.DoesNotExist:
            return Response({'error': 'Invalid parent_message_uuid.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = MessageSerializer(data=data)
    if serializer.is_valid():
        message_instance = serializer.save(
            sender=request.user,
            conversation=conversation,
            parent_message=parent
        )
        # Return full nested object (including attachments=[] and reactions=[])
        full_serializer = MessageSerializer(message_instance, context={'request': request})
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
def unsend_message(request, message_id):
    message = get_object_or_404(Message, uuid=message_id)
    if request.user in [message.sender, message.recipient]:
        message.delete_for_user(request.user)
        return Response({'status': 'message unsent'}, status=200)
    return Response({'error': 'Unauthorized'}, status=403)




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def message_settings(request):
    """
    Handle GET and POST requests for message settings.
    GET: Retrieve the current message settings for the authenticated user.
    POST: Update the message settings for the authenticated user.
    """

    # Try to get the user's message settings, or create them if they don't exist
    try:
        settings = request.user.message_settings
    except ObjectDoesNotExist:
        # If the message settings don't exist for the user, create a new instance with default values
        settings = MessageSettings.objects.create(user=request.user)
    
    # Inside your view (message_settings)
    if request.method == 'POST':
        try:
            data = request.data
            allow_messages_from_followers = data.get('allow_messages_from_followers', settings.allow_messages_from_followers)
            allow_messages_from_others = data.get('allow_messages_from_others', settings.allow_messages_from_others)
            
            # Update settings
            settings.allow_messages_from_followers = allow_messages_from_followers
            settings.allow_messages_from_others = allow_messages_from_others
            settings.save()

            return Response({
                'success': True,
                'message': 'Message settings updated successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


    elif request.method == 'GET':        
        # Return the current settings as JSON
        return Response({
            'allow_messages_from_followers': settings.allow_messages_from_followers,
            'allow_messages_from_others': settings.allow_messages_from_others,
        }, status=status.HTTP_200_OK)
