from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Notification
from .serializers import NotificationSerializer
from ...user.interactUser.models import InteractUser
from ...user.baseUser.models import BaseUser

@api_view(['GET'])
def user_notifications(request):
    user_id = request.user.id
    try:
        notifications = Notification.objects.filter(recipient_id=user_id)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
def mark_notification_as_read(request, id):
    try:
        notification = Notification.objects.get(id=id)
        print(f"Notification found: {notification}")
        notification.unread = False
        notification.save()
        return Response({'status': 'Notification marked as read'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        print(f"Notification not found for id: {id}")
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"An error occurred: {e}")
        return Response({'error': 'An error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_follow_request(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        sender = notification.actor
        recipient = notification.recipient

        if notification.verb != 'sent you a follow request':
            return Response({'error': 'Invalid notification type'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = recipient.interactuser.timeline_user
        sender = sender.interactuser.timeline_user
        
        recipient.accept_follow_request(sender)
        notification.delete()

        return Response({'message': 'Follow request accepted'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_follow_request(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        sender = notification.actor
        recipient = notification.recipient

        if notification.verb != 'sent you a follow request':
            return Response({'error': 'Invalid notification type'}, status=status.HTTP_400_BAD_REQUEST)

        recipient.follow_requests.remove(sender)
        notification.delete()

        return Response({'message': 'Follow request rejected'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def withdraw_follow_request(request, recipient_id):
    try:
        # Get the recipient user by id
        recipient = BaseUser.objects.get(id=recipient_id)
        print(f'recipient {recipient}')
        current_user = request.user

        # Find the notification related to the follow request
        notification = Notification.objects.get(
            recipient=recipient,
            actor=current_user,
            verb='sent you a follow request'
        )

        # Check if the notification type is correct
        if notification.verb != 'sent you a follow request':
            return Response({'error': 'Invalid notification type'}, status=status.HTTP_400_BAD_REQUEST)

        current_user = current_user.interactuser.timeline_user
        recipient = recipient.interactuser.timeline_user
        # Remove the follow request and delete the notification
        recipient.follow_requests.remove(current_user)
        notification.delete()

        return Response({'message': 'Follow request withdrawn'}, status=status.HTTP_200_OK)
    except InteractUser.DoesNotExist:
        return Response({'error': 'Recipient user not found'}, status=status.HTTP_404_NOT_FOUND)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)