from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async
from ..models import Chat, Message, ChatParticipant
from ..serializers import MessageSerializer
from ....user.interactUser.models import InteractUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_uuid = self.scope['url_route']['kwargs']['uuid']
        self.room_group_name = f'chat_{self.chat_uuid}'
        
        # Join chat group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave chat group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        user_id = data.get('user_id')  # Get the user ID from the message

        # Fetch the chat and check if the user is allowed to send messages
        chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
        participant = await sync_to_async(InteractUser.objects.get)(pk=user_id)

        participant_in_chat = await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).exists)()
        is_restricted = await sync_to_async(lambda: ChatParticipant.objects.get(chat=chat, participant=participant).restricted)()

        # Check if the user is the inviter
        is_inviter = await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant, is_inviter=True).exists)()

        # Check if the user has accepted the invitation
        accepted_invites = await sync_to_async(ChatParticipant.objects.filter(chat=chat, accepted=True).count)()

        # Check if the user is allowed to send messages
        if is_inviter:
            if accepted_invites > 0:
                # If the inviter and at least one participant have accepted, remove restriction
                await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).update)(restricted=False)
            elif await sync_to_async(chat.messages.count)() >= 3:
                # If the inviter has sent 3 messages and no one has accepted, remove restriction for inviter only
                await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).update)(restricted=False)

        if is_inviter and accepted_invites == 0 and await sync_to_async(chat.messages.count)() < 3:
            # Save message to database
            message_instance = await self.save_message_to_database(message, user_id)
            if message_instance:
                message_data = MessageSerializer(message_instance).data
                # Send message to chat group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_data
                    }
                )
        elif accepted_invites > 0:
            if not is_restricted:
                # Save message to database
                message_instance = await self.save_message_to_database(message, user_id)
                if message_instance:
                    message_data = MessageSerializer(message_instance).data
                    if accepted_invites > 0 and not is_restricted:
                        # Send message to WebSocket
                        await self.send(text_data=json.dumps({
                            'type': 'chat_message',
                            'message': message_data
                        }))
                    else:
                        # Ignore the message
                        pass
            else:
                # Ignore the message or send an error response back to the user
                await self.send(text_data=json.dumps({
                    'error': 'You are not allowed to send messages in this chat until you accept the invitation.'
                }))
        else:
            # Ignore the message or send an error response back to the user
            await self.send(text_data=json.dumps({
                'error': 'You are not allowed to send messages in this chat until at least one participant accepts the invitation.'
            }))






    async def save_message_to_database(self, message, user_id):
        try:
            chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
            sender = await sync_to_async(InteractUser.objects.get)(pk=user_id)

            message_instance = Message(chat=chat, sender=sender, content=message)
            await sync_to_async(message_instance.save)()

            return message_instance
        except InteractUser.DoesNotExist:
            print(f"InteractUser with pk={user_id} does not exist")
        except Exception as e:
            print(f"chat_uuid={self.chat_uuid} user_pk={user_id}. An error occurred: {e}")
        return None

    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
