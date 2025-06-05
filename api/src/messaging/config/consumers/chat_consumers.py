# app/messages/consumers.py

from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.utils.timezone import now
from asgiref.sync import sync_to_async

from src.messaging.models import Message, Conversation, Participant, Reaction
from src.messaging.serializers import MessageSerializer, ReactionSerializer
from src.user.models import BaseUser


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for a single conversation.
    Supports:
      - Receiving new chat messages (text-only via WebSocket).
      - Adding/removing reactions (via `action`: 'add_reaction' / 'remove_reaction').
      - Broadcasting back `chat_message` or `reaction_update`.
    """

    # ─── Helpers: wrap ORM calls in sync_to_async ───

    @sync_to_async
    def get_conversation(self, conversation_id):
        return Conversation.objects.get(uuid=conversation_id)

    @sync_to_async
    def get_sender(self, sender_username):
        return BaseUser.objects.get(username=sender_username)

    @sync_to_async
    def create_message(self, conversation, sender, message_content, parent_uuid=None):
        parent = None
        if parent_uuid:
            try:
                parent = Message.objects.get(uuid=parent_uuid)
            except Message.DoesNotExist:
                parent = None

        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            text=message_content,
            parent_message=parent,
            sent_at=now(),
        )

    @sync_to_async
    def get_conversation_message(self, message_uuid):
        return Message.objects.get(uuid=message_uuid)

    @sync_to_async
    def get_participants(self, conversation):
        return list(
            Participant.objects.filter(conversation=conversation)
                               .select_related("user")
        )

    @sync_to_async
    def update_invite_sent(self, conversation):
        conversation.is_invite_sent = True
        conversation.save()

    @sync_to_async
    def save_participant(self, participant):
        participant.save()

    @sync_to_async
    def get_message_settings(self, user):
        return user.message_settings

    @sync_to_async
    def user_follows(self, user, possible_follower):
        return user.followers.filter(id=possible_follower.id).exists()


    # ─── “Connect” / “Disconnect” ───

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        # Note: self.scope["user"] is a SimpleLazyObject. We will unwrap it when needed.
        self.user = self.scope["user"]
        self.chat_group_name = f"chat_{self.conversation_id}"

        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )


    # ─── “receive” (incoming WS messages) ───

    async def receive(self, text_data):
        """
        Handles two “action” types:
          1) add_reaction / remove_reaction
          2) normal chat message (text + optional parent_uuid)
        """
        data = json.loads(text_data)

        # ——— 1) ‘add_reaction’ ———
        if data.get('action') == 'add_reaction':
            msg_uuid = data.get('message_uuid')
            reaction_type = data.get('reaction_type')

            # Instead of using self.scope["user"] (LazyUser), fetch the real BaseUser:
            sender_username = self.scope["user"].username
            try:
                user_obj = await self.get_sender(sender_username)
            except BaseUser.DoesNotExist:
                # Shouldn’t really happen if they’re authenticated, but be defensive
                await self.send(json.dumps({'error': 'User not found'}))
                return

            # Validate reaction_type
            if reaction_type not in dict(Reaction.REACTION_CHOICES):
                await self.send(json.dumps({'error': 'Invalid reaction_type.'}))
                return

            try:
                message = await self.get_conversation_message(msg_uuid)
            except Message.DoesNotExist:
                await self.send(json.dumps({'error': 'Message not found'}))
                return

            # Create (or get) the Reaction
            # Use sync_to_async on a lambda so that Django ORM runs in the threadpool
            await sync_to_async(lambda: Reaction.objects.get_or_create(
                message=message,
                user=user_obj,            # <-- now a real BaseUser, not a LazyUser
                reaction_type=reaction_type
            ))()

            # Re-serialize the full reaction list
            reactions_qs = await sync_to_async(lambda: message.reactions.all())()
            reactions_data = await sync_to_async(
                lambda: ReactionSerializer(reactions_qs, many=True).data
            )()

            # Broadcast updated reaction list to everyone in the group
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'reaction_update',
                    'message_uuid': msg_uuid,
                    'reactions': reactions_data,
                }
            )
            return


        # ——— 2) ‘remove_reaction’ ———
        elif data.get('action') == 'remove_reaction':
            msg_uuid = data.get('message_uuid')
            reaction_type = data.get('reaction_type')

            # Again unwrap the lazy user to a real BaseUser:
            sender_username = self.scope["user"].username
            try:
                user_obj = await self.get_sender(sender_username)
            except BaseUser.DoesNotExist:
                await self.send(json.dumps({'error': 'User not found'}))
                return

            try:
                message = await self.get_conversation_message(msg_uuid)
            except Message.DoesNotExist:
                await self.send(json.dumps({'error': 'Message not found'}))
                return

            try:
                # Again, user_obj is a real BaseUser:
                reaction = await sync_to_async(lambda: Reaction.objects.get(
                    message=message,
                    user=user_obj,
                    reaction_type=reaction_type
                ))()
                await sync_to_async(reaction.delete)()
            except Reaction.DoesNotExist:
                await self.send(json.dumps({'error': 'Reaction not found'}))
                return

            # Re-serialize the full reaction list
            reactions_qs = await sync_to_async(lambda: message.reactions.all())()
            reactions_data = await sync_to_async(
                lambda: ReactionSerializer(reactions_qs, many=True).data
            )()

            # Broadcast updated reaction-list
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'reaction_update',
                    'message_uuid': msg_uuid,
                    'reactions': reactions_data,
                }
            )
            return


        # ——— 3) Otherwise, normal chat message ———
        else:
            message_content = data.get('text')
            sender_username = data.get('sender_username')
            parent_uuid = data.get('parent_message_uuid', None)

            if not message_content or not sender_username:
                await self.send(json.dumps({'error': 'Missing message or sender'}))
                return

            # 3a) Fetch conversation + sender (now using get_sender to unwrap the LazyUser)
            try:
                conversation = await self.get_conversation(self.conversation_id)
                sender = await self.get_sender(sender_username)
            except (Conversation.DoesNotExist, BaseUser.DoesNotExist):
                await self.send(json.dumps({'error': 'Conversation or sender not found'}))
                return

            # 3b) Participant-status checks (unchanged)
            participants = await self.get_participants(conversation)
            num_participants = len(participants)
            is_group_chat = num_participants > 2

            has_messages = await sync_to_async(lambda: conversation.messages.exists())()

            if not has_messages:
                await self.update_invite_sent(conversation)
                await self.evaluate_participants(conversation, sender)
                message = await self.create_message(conversation, sender, message_content, parent_uuid)
            else:
                if is_group_chat:
                    has_active = await sync_to_async(lambda: Participant.objects.filter(
                        conversation=conversation, status="active", user=sender
                    ).exists())()
                    if not has_active:
                        await self.send(json.dumps({"error": "You have not accepted the invitation yet."}))
                        return

                message = await self.create_message(conversation, sender, message_content, parent_uuid)

            # 3c) Serialize and broadcast
            msg_obj = await self.get_conversation_message(message.uuid)
            payload = await sync_to_async(
                lambda: MessageSerializer(msg_obj, context={'request': None}).data
            )()

            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': payload,
                }
            )

    # ─── Handlers for “group_send” events ───

    async def reaction_update(self, event):
        """
        Forwards a ‘reaction_update’ event to this WebSocket client.
        """
        await self.send(
            text_data=json.dumps({
                'type': 'reaction_update',
                'message_uuid': event['message_uuid'],
                'reactions': event['reactions'],
            }, default=str)
        )

    async def chat_message(self, event):
        """
        Forwards a ‘chat_message’ event to this WebSocket client.
        """
        await self.send(
            text_data=json.dumps({
                'type': 'chat_message',
                'message': event['message'],
            }, default=str)
        )
