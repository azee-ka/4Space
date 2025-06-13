from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.utils.timezone import now
from asgiref.sync import sync_to_async

from src.messaging.models import Message, Conversation, Participant, Reaction
from src.messaging.serializers import MessageSerializer, ReactionSerializer
from src.user.models import BaseUser


class ChatConsumer(AsyncWebsocketConsumer):
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
            Participant.objects.filter(conversation=conversation).select_related("user")
        )

    @sync_to_async
    def update_invite_sent(self, conversation):
        conversation.is_invite_sent = True
        conversation.save()

    async def evaluate_participants(self, conversation, sender):
        participants = await sync_to_async(list)(Participant.objects.filter(conversation=conversation))
        is_group_chat = len(participants) > 2

        for participant in participants:
            participant_user = await sync_to_async(lambda: participant.user)()
            if participant_user == sender or participant.status == 'blocked':
                continue

            message_settings = await sync_to_async(lambda: participant_user.message_settings)()

            if is_group_chat:
                allow_messages = await sync_to_async(lambda: (
                    message_settings.allow_messages_from_others == 'allow' or
                    (sender in participant_user.followers.all() and
                     message_settings.allow_messages_from_followers == 'allow')
                ))()
                if allow_messages:
                    participant.status = 'invited'
                else:
                    allow_requests = await sync_to_async(lambda: (
                        message_settings.allow_messages_from_others == 'requests' or
                        (sender in participant_user.followers.all() and
                         message_settings.allow_messages_from_followers == 'requests')
                    ))()
                    participant.status = 'invited' if allow_requests else 'added'
            else:
                allow_messages = await sync_to_async(lambda: (
                    message_settings.allow_messages_from_others == 'allow' or
                    (sender in participant_user.followers.all() and
                     message_settings.allow_messages_from_followers == 'allow')
                ))()
                if allow_messages:
                    participant.status = 'active'
                else:
                    allow_requests = await sync_to_async(lambda: (
                        message_settings.allow_messages_from_others == 'requests' or
                        (sender in participant_user.followers.all() and
                         message_settings.allow_messages_from_followers == 'requests')
                    ))()
                    participant.status = 'invited' if allow_requests else 'added'

            await sync_to_async(participant.save)()

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
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

    async def receive(self, text_data):
        data = json.loads(text_data)

        # 1. Add Reaction
        if data.get('action') == 'add_reaction':
            msg_uuid = data.get('message_uuid')
            reaction_type = data.get('reaction_type')
            sender_username = self.scope["user"].username

            try:
                user_obj = await self.get_sender(sender_username)
                message = await self.get_conversation_message(msg_uuid)
            except (BaseUser.DoesNotExist, Message.DoesNotExist):
                await self.send(json.dumps({'error': 'User or message not found'}))
                return

            if reaction_type not in dict(Reaction.REACTION_CHOICES):
                await self.send(json.dumps({'error': 'Invalid reaction_type.'}))
                return

            await sync_to_async(lambda: Reaction.objects.get_or_create(
                message=message,
                user=user_obj,
                reaction_type=reaction_type
            ))()

            reactions_qs = await sync_to_async(lambda: message.reactions.all())()
            reactions_data = await sync_to_async(
                lambda: ReactionSerializer(reactions_qs, many=True).data
            )()

            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'reaction_update',
                    'message_uuid': msg_uuid,
                    'reactions': reactions_data,
                }
            )
            return

        # 2. Remove Reaction
        elif data.get('action') == 'remove_reaction':
            msg_uuid = data.get('message_uuid')
            reaction_type = data.get('reaction_type')
            sender_username = self.scope["user"].username

            try:
                user_obj = await self.get_sender(sender_username)
                message = await self.get_conversation_message(msg_uuid)
                reaction = await sync_to_async(lambda: Reaction.objects.get(
                    message=message,
                    user=user_obj,
                    reaction_type=reaction_type
                ))()
                await sync_to_async(reaction.delete)()
            except (BaseUser.DoesNotExist, Message.DoesNotExist, Reaction.DoesNotExist):
                await self.send(json.dumps({'error': 'Could not remove reaction'}))
                return

            reactions_qs = await sync_to_async(lambda: message.reactions.all())()
            reactions_data = await sync_to_async(
                lambda: ReactionSerializer(reactions_qs, many=True).data
            )()

            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'reaction_update',
                    'message_uuid': msg_uuid,
                    'reactions': reactions_data,
                }
            )
            return

        # 3. Normal Message
        else:
            message_content = data.get('text')
            sender_username = data.get('sender_username')
            parent_uuid = data.get('parent_message_uuid', None)

            if not message_content or not sender_username:
                await self.send(json.dumps({'error': 'Missing message or sender'}))
                return

            try:
                conversation = await self.get_conversation(self.conversation_id)
                sender = await self.get_sender(sender_username)
            except (Conversation.DoesNotExist, BaseUser.DoesNotExist):
                await self.send(json.dumps({'error': 'Conversation or sender not found'}))
                return

            participants = await self.get_participants(conversation)
            is_group_chat = len(participants) > 2
            has_messages = await sync_to_async(lambda: conversation.messages.exists())()

            if not has_messages:
                await self.update_invite_sent(conversation)
                await self.evaluate_participants(conversation, sender)
                message = await self.create_message(conversation, sender, message_content, parent_uuid)
            else:
                if is_group_chat:
                    is_active = await sync_to_async(lambda: Participant.objects.filter(
                        conversation=conversation,
                        status='active',
                        user=sender
                    ).exists())()
                    if not is_active:
                        await self.send(json.dumps({'error': 'You have not accepted the invitation yet.'}))
                        return
                message = await self.create_message(conversation, sender, message_content, parent_uuid)

            msg_obj = await self.get_conversation_message(message.uuid)
            payload = await sync_to_async(lambda: MessageSerializer(msg_obj, context={'request': None}).data)()

            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': payload,
                }
            )

    async def reaction_update(self, event):
        await self.send(
            text_data=json.dumps({
                'type': 'reaction_update',
                'message_uuid': event['message_uuid'],
                'reactions': event['reactions'],
            }, default=str)
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps({
                'type': 'chat_message',
                'message': event['message'],
            }, default=str)
        )
