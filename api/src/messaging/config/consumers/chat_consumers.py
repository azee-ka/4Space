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
      - Receiving new chat messages (text‐only via WebSocket).
      - First‐message invite logic (evaluate participants).
      - Adding/removing reactions (via `action`: 'add_reaction' / 'remove_reaction').
      - Broadcasting back `chat_message` or `reaction_update`.
    """

    # ─── Helpers: wrap any ORM call in sync_to_async ───

    @sync_to_async
    def get_conversation(self, conversation_id):
        return Conversation.objects.get(uuid=conversation_id)

    @sync_to_async
    def get_sender(self, sender_username):
        return BaseUser.objects.get(username=sender_username)

    @sync_to_async
    def create_message(self, conversation, sender, message_content, parent_uuid=None):
        """
        Creates a new Message. If parent_uuid is provided and valid,
        we set message.parent_message to that Message instance.
        """
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
        # Preload `.user` so accessing `participant.user` won’t hit the DB again
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
        # Extract conversation_id (UUID) from URL route
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope["user"]  # Authenticated user
        self.chat_group_name = f"chat_{self.conversation_id}"

        # Join the channel-layer group for this conversation
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    # ─── Participant-invite logic ───

    async def evaluate_participants(self, conversation, sender):
        """
        Called on the very first message in a conversation.
        Decides which participants become “invited” vs. “active” vs. “added”.
        Runs entirely inside async by awaiting sync_to_async calls.
        """
        participants = await self.get_participants(conversation)
        is_group_chat = len(participants) > 2

        for participant in participants:
            participant_user = participant.user  # already select_related

            if participant_user.id == sender.id:
                continue  # skip the sender

            if participant.status == 'blocked':
                continue  # skip blocked users

            message_settings = await self.get_message_settings(participant_user)

            if is_group_chat:
                allow_messages = (
                    message_settings.allow_messages_from_others == 'allow'
                    or (
                        await self.user_follows(participant_user, sender)
                        and message_settings.allow_messages_from_followers == 'allow'
                    )
                )
                if allow_messages:
                    participant.status = 'invited'
                else:
                    allow_requests = (
                        message_settings.allow_messages_from_others == 'requests'
                        or (
                            await self.user_follows(participant_user, sender)
                            and message_settings.allow_messages_from_followers == 'requests'
                        )
                    )
                    participant.status = 'invited' if allow_requests else 'added'
            else:
                allow_messages = (
                    message_settings.allow_messages_from_others == 'allow'
                    or (
                        await self.user_follows(participant_user, sender)
                        and message_settings.allow_messages_from_followers == 'allow'
                    )
                )
                if allow_messages:
                    participant.status = 'active'
                else:
                    allow_requests = (
                        message_settings.allow_messages_from_others == 'requests'
                        or (
                            await self.user_follows(participant_user, sender)
                            and message_settings.allow_messages_from_followers == 'requests'
                        )
                    )
                    participant.status = 'invited' if allow_requests else 'added'

            await self.save_participant(participant)

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
            user = self.scope['user']

            # Validate
            if reaction_type not in dict(Reaction.REACTION_CHOICES):
                await self.send(json.dumps({'error': 'Invalid reaction_type.'}))
                return

            try:
                message = await self.get_conversation_message(msg_uuid)
            except Message.DoesNotExist:
                await self.send(json.dumps({'error': 'Message not found'}))
                return

            # Create or get existing Reaction
            await sync_to_async(lambda: Reaction.objects.get_or_create(
                message=message, user=user, reaction_type=reaction_type
            ))()

            # Re-serialize full reaction list
            reactions_qs = await sync_to_async(lambda: message.reactions.all())()
            reactions_data = await sync_to_async(
                lambda: ReactionSerializer(reactions_qs, many=True).data
            )()

            # Broadcast updated reaction-list to all group members
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
            user = self.scope['user']

            try:
                message = await self.get_conversation_message(msg_uuid)
            except Message.DoesNotExist:
                await self.send(json.dumps({'error': 'Message not found'}))
                return

            try:
                reaction = await sync_to_async(lambda: Reaction.objects.get(
                    message=message, user=user, reaction_type=reaction_type
                ))()
                await sync_to_async(reaction.delete)()
            except Reaction.DoesNotExist:
                await self.send(json.dumps({'error': 'Reaction not found'}))
                return

            # Re-serialize full reaction list
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

            # 3a) Fetch conversation + sender
            try:
                conversation = await self.get_conversation(self.conversation_id)
                sender = await self.get_sender(sender_username)
            except (Conversation.DoesNotExist, BaseUser.DoesNotExist):
                await self.send(json.dumps({'error': 'Conversation or sender not found'}))
                return

            # 3b) Check participant-status if group-chat
            participants = await self.get_participants(conversation)
            num_participants = len(participants)
            is_group_chat = num_participants > 2

            # Check if any messages exist
            has_messages = await sync_to_async(lambda: conversation.messages.exists())()

            if not has_messages:
                # It’s the VERY FIRST message in this conversation:
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

            # 3c) Serialize the newly-created Message instance
            msg_obj = await self.get_conversation_message(message.uuid)
            payload = await sync_to_async(
                lambda: MessageSerializer(msg_obj, context={'request': None}).data
            )()

            # 3d) Broadcast to everyone in this conversation
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',  # triggers self.chat_message
                    'message': payload,
                }
            )

    # ─── Handlers for “group_send” events ───

    async def reaction_update(self, event):
        """
        Receives a ‘reaction_update’ event from group_send and forwards it to this WebSocket client.
        """
        await self.send(
            text_data=json.dumps({
                'type': 'reaction_update',
                'message_uuid': event['message_uuid'],
                'reactions': event['reactions'],
            }, default=str)  # <-- default=str ensures UUID → string
        )

    async def chat_message(self, event):
        """
        Receives a ‘chat_message’ event from group_send and forwards it to this WebSocket client.
        """
        await self.send(
            text_data=json.dumps({
                'type': 'chat_message',
                'message': event['message'],
            }, default=str)  # <-- default=str ensures UUID → string
        )
