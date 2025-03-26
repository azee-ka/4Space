from channels.generic.websocket import AsyncWebsocketConsumer
import json
from src.messaging.models import Message, Conversation, Participant
from django.utils.timezone import now
from src.user.models import BaseUser
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    
    # Sync to async wrapper for ORM operations
    @sync_to_async
    def get_conversation(self, conversation_id):
        return Conversation.objects.get(uuid=conversation_id)

    @sync_to_async
    def get_sender(self, sender_username):
        return BaseUser.objects.get(username=sender_username)

    @sync_to_async
    def create_message(self, conversation, sender, message_content):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            text=message_content,
            sent_at=now()
        )
    
    @sync_to_async
    def get_participants(self, conversation):
        print(f'Fetching participants for conversation: {conversation.uuid}')
        # Fetch Participant objects related to the given conversation
        participants = Participant.objects.filter(conversation=conversation)
        print(f'Participants found: {participants}')
        return participants

    @sync_to_async
    def update_invite_sent(self, conversation):
        conversation.is_invite_sent = True
        conversation.save()

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope["user"]  # Get the user from the scope
        self.chat_group_name = f"chat_{self.conversation_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # conversation = await self.get_conversation(self.conversation_id)
        # if not await sync_to_async(conversation.messages.exists)():
        #     await sync_to_async(conversation.delete)()

        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    async def evaluate_participants(self, conversation, sender):
        print('Evaluating participants...')

        participants = await sync_to_async(list)(Participant.objects.filter(conversation=conversation))
        is_group_chat = len(participants) > 2
        print(f'is_group_chat: {is_group_chat}')

        for participant in participants:
            participant_user = await sync_to_async(lambda: participant.user)()

            if participant_user == sender:
                continue  # Skip the sender
            
            # Check if the user is blocked
            if participant.status == 'blocked':
                continue  # Skip further checks for blocked users

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

                    if allow_requests:
                        participant.status = 'invited'
                    else:
                        participant.status = 'added'
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

                    if allow_requests:
                        participant.status = 'invited'
                    else:
                        participant.status = 'added'

            await sync_to_async(participant.save)()

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get('text')
        sender_username = data.get('sender_username')

        if not message_content or not sender_username:
            await self.send(text_data=json.dumps({'error': 'Missing message or sender'}))
            return

        try:
            conversation = await self.get_conversation(self.conversation_id)
            sender = await self.get_sender(sender_username)
        except (Conversation.DoesNotExist, BaseUser.DoesNotExist):
            await self.send(text_data=json.dumps({'error': 'Conversation or sender not found'}))
            return

        participants = await self.get_participants(conversation)
        is_group_chat = await sync_to_async(lambda: len(participants))() > 2

        # Handle the first message scenario
        if not await sync_to_async(conversation.messages.exists)():
            print(f'First message for conversation {conversation.uuid}')
            await self.update_invite_sent(conversation)
            await self.evaluate_participants(conversation, sender)
            message = await self.create_message(conversation, sender, message_content)
        else:
            # For subsequent messages in a group chat, ensure the sender is active
            if is_group_chat:
                accepted_users = await sync_to_async(lambda: participants.filter(status='active').all())()
                if sender not in accepted_users:
                    await self.send(text_data=json.dumps({'error': 'User has not accepted the invitation yet.'}))
                    return

            message = await self.create_message(conversation, sender, message_content)

                
        print(f'Message created: {message}')
        
        chat_group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_send(
            chat_group_name,
            {
                'type': 'chat_message',
                'text': message.text,
                'sender_username': sender.username,
                'sent_at': message.sent_at.isoformat(),
                'uuid': str(message.uuid),
            }
        )


    async def chat_message(self, event):
        text = event['text']  # Using 'text' to match the client-side
        sender_username = event['sender_username']
        sent_at = event['sent_at']
        uuid = event['uuid']

        # Send the message to WebSocket client
        await self.send(text_data=json.dumps({
            'text': text,  # Match 'text' with what the client expects
            'sender_username': sender_username,
            'sent_at': sent_at,
            'uuid': uuid,
        }))
