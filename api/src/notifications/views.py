from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class NotificationDetailView(APIView):
    """
    API endpoint to fetch details of a specific notification by ID.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        try:
            # Fetch the notification for the authenticated user
            notification = Notification.objects.get(id=notification_id, user=request.user)
            serializer = NotificationSerializer(notification)
            return Response(serializer.data)
        except Notification.DoesNotExist:
            # Return error if notification is not found
            return Response({"status": "error", "message": "Notification not found"}, status=404)
        
        
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.mark_as_read()
            return Response({"status": "success", "message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response({"status": "error", "message": "Notification not found"}, status=404)