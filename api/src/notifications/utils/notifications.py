from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def send_notification_to_user(user_id, notification):
    """
    Send a real-time notification to a specific user via WebSocket.

    Args:
        user_id (int): The ID of the user to send the notification to.
        notification (Notification): The Notification instance to be sent.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "send_notification",
            "data": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type,
                "action_url": notification.action_url,
                "created_at": notification.created_at.isoformat(),
            },
        },
    )
