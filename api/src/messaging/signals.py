# src/messaging/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Message, Conversation, Participant
from ..notifications.models import Notification
from ..notifications.serializers import NotificationSerializer
from ..notifications.utils import send_push_to_user  # (we’ll define this later)

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance: Message, created, **kwargs):
    """
    Whenever a Message is created (via WS or REST), create a Notification
    for each *other* participant in the conversation and push it via Channels.
    """
    if not created:
        return  # we only want to do this on insert, not on updates

    message = instance
    conversation = message.conversation
    sender_user = message.sender

    # 1) Find all *active* participants except the sender.
    #    If you want to notify even “added/invited” participants, adjust accordingly.
    recipients = (
        Participant.objects
        .filter(conversation=conversation, status="active")
        .exclude(user=sender_user)
        .select_related("user")
    )

    channel_layer = get_channel_layer()

    for participant in recipients:
        recipient = participant.user

        # 2) Create a Notification object for this recipient. You may want to include
        #    a URL that points to “open chat with <conversation.id>”. We’ll assume
        #    you have a front-end route like `/chat/<conversation_uuid>/`.
        #
        #    If your front-end is React Native, “action_url” might be a deep-link,
        #    e.g. “myapp://chat/<conversation_uuid>”.

        convo_uuid = str(conversation.uuid)
        title_text = f"New message from {sender_user.get_full_name() or sender_user.username}"
        message_preview = (message.text[:50] + "…") if message.text else "Sent an attachment"
        action_url = f"/chat/{convo_uuid}/"  # adjust to match your front-end routing

        notif = Notification.objects.create(
            user=recipient,
            sender=sender_user,
            title=title_text,
            message=message_preview,
            type="action",  # e.g. some apps use “action” for “you need to click something”
            action_url=action_url,
        )

        # 3) Serialize the notification instance (so that we can send JSON over WS).
        data = NotificationSerializer(notif).data

        # 4) Broadcast the notification payload to the recipient’s group “user_<id>”.
        #    NotificationConsumer already does: `await channel_layer.group_add("user_<id>", ...)`
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}",
            {
                "type": "send_notification",  # maps to NotificationConsumer.send_notification()
                "data": data,
            }
        )

        # 5) (Optional) If this user has granted “push notifications” in their settings,
        #    send a mobile push. We’ll assume you have a helper function `send_push_to_user(...)`.
        #    That might look up their saved device tokens and call FCM/APNs.
        send_push_to_user(recipient, title=title_text, body=message_preview, data={"convo_uuid": convo_uuid})