from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async
from ..models import Chat, Message
from ..serializers import MessageSerializer
from ....user.interactUser.models import InteractUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_uuid = self.scope['url_route']['kwargs']['uuid']
        self.room_group_name = f'chat_{self.chat_uuid}'
        
        print(f'chat uuid: {self.chat_uuid}')
        print(f'group name: {self.room_group_name}')
        
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

        # Fetch the chat and first message sender
        chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
        first_message = await sync_to_async(Message.objects.filter(chat=chat).order_by('timestamp').first)()

        # Check if the user is allowed to send messages
        allow_message = first_message is None or (first_message.sender_id == user_id) or not chat.restricted

        if allow_message:
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
        else:
            # Ignore the message or optionally send an error response back to the user
            await self.send(text_data=json.dumps({
                'error': 'You are not allowed to send messages in this chat.'
            }))

    async def save_message_to_database(self, message, user_id):
        try:
            chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
            sender = await sync_to_async(InteractUser.objects.get)(pk=user_id)
            
            if chat.restricted:
                # Check if the chat is restricted and the message limit is reached
                message_count = await sync_to_async(Message.objects.filter(chat=chat).count)()
                if message_count >= 3:
                    raise Exception("Message limit reached for this chat.")

            message_instance = Message(chat=chat, sender=sender, content=message)

            await sync_to_async(message_instance.save)()
            if message_instance is None:
                return None
            
            # Reload the instance to ensure all fields are populated
            message_instance = await sync_to_async(Message.objects.select_related('sender').get)(pk=message_instance.pk)
                        
            return message_instance

        except InteractUser.DoesNotExist:
            print(f"BaseUser with pk={user_id} does not exist")
        except Exception as e:
            print(f"chat_uuid={self.chat_uuid} user_pk={user_id}. An error occurred: {e}")
        return None

    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
