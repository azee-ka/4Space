from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

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
        notification = Notification.objects.get(id=id, recipient=request.user)
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
