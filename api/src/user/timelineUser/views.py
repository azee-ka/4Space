# views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from ..baseUser.models import BaseUser
from .models import TimelineUser
from .serializers import TimelineUserSerializer, TimelineUserBriefSerializer
from .serializers import PartialTimelineProfileSerializer, FullTimelineProfileSerializer
from ...components.notification.models import Notification
from ...components.notification.serializers import NotificationSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interact_user_data(request, user_id):
    print(f'user_id {user_id}')
    try:
        user = TimelineUser.objects.get(user_id=user_id)
    except TimelineUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    serializer = TimelineUserBriefSerializer(user)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([AllowAny])
def profile_view(request, user_id):
    try:
        base_profile_owner = BaseUser.objects.get(id=user_id)
        profile_owner = base_profile_owner.interactuser.timeline_user
        is_private = profile_owner.is_private_profile

        serializer_context = {'request': request}

        if request.user.is_authenticated:
            requesting_user = request.user.interactuser.timeline_user

            if requesting_user == profile_owner:
                serializer = TimelineUserSerializer(profile_owner, context=serializer_context)
                return Response({
                    'profile': serializer.data,
                    'viewable': 'self'
                })

            if is_private:
                is_following = profile_owner.followers.filter(user=requesting_user).exists()
                is_connected = profile_owner.connections.filter(user=requesting_user).exists()

                if not (is_following or is_connected):
                    serializer = PartialTimelineProfileSerializer(profile_owner, context=serializer_context)
                    return Response({
                        'profile': serializer.data,
                        'viewable': 'partial'
                    })

        if is_private and not request.user.is_authenticated:
            return Response({'error': 'Unauthorized access to private profile'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = FullTimelineProfileSerializer(profile_owner, context=serializer_context)
        return Response({
            'profile': serializer.data,
            'viewable': 'full'
        })

    except TimelineUser.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_visibility_status(request):
    try:
        # Assuming the request user has a one-to-one relation with InteractUser
        user = request.user.timelineuser

        return Response({
            'is_private_profile': user.is_private_profile
        }, status=status.HTTP_200_OK)
    except TimelineUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_profile_visibility(request):
    try:
        # Assuming the request user has a one-to-one relation with InteractUser
        user = request.user.timelineuser
        user.is_private_profile = not user.is_private_profile
        user.save()

        return Response({
            'message': 'Profile visibility toggled successfully',
            'is_private_profile': user.is_private_profile
        }, status=status.HTTP_200_OK)
    except TimelineUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    
    
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_unfollow_user(request, user_id):
    try:
        target_user = TimelineUser.objects.get(user_id=user_id)
        current_user = request.user.timelineuser

        if target_user == current_user:
            return Response({'error': 'You cannot follow/unfollow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.followers.filter(user=current_user).exists():
            target_user.remove_follower(current_user)
            message = 'Unfollowed user successfully'
        else:
            if target_user.is_private_profile:
                target_user.send_follow_request(current_user)
                
                target_user = target_user.interactuser.user
                current_user = current_user.interactuser.user
                # Notify the target user via WebSocket
                notification = Notification.objects.create(
                    recipient=target_user,
                    actor=current_user,
                    verb=f'sent you a follow request',
                    notification_type='action'
                )
                serializer = NotificationSerializer(notification)
                channel_layer = get_channel_layer()  # Get the channel_layer instance
                async_to_sync(channel_layer.group_send)(
                    f"user_{target_user.id}",
                    {
                        'type': 'send_notification',
                        'notification': serializer.data
                    }
                )
                message = 'Follow request sent successfully'
            else:
                target_user.add_follower(current_user)
                message = 'Followed user successfully'

        return Response({'message': message}, status=status.HTTP_200_OK)

    except TimelineUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_disconnect_user(request, user_id):
    try:
        target_user = TimelineUser.objects.get(user_id=user_id)
        current_user = request.user.timelineuser

        if target_user == current_user:
            return Response({'error': 'You cannot connect/disconnect with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.connections.filter(user=current_user).exists():
            target_user.remove_connection(current_user)
            message = 'Disconnected user successfully'
        else:
            target_user.add_connection(current_user)
            message = 'Connected with user successfully'

        return Response({'message': message}, status=status.HTTP_200_OK)
    
    except TimelineUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)