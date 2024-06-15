from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['id']
        self.room_group_name = f'chat_{self.chat_id}'
        
        print(f'chatid: {self.chat_id}')
        print(f'groupname: {self.room_group_name}')
        
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

        # Save message to database
        message_instance = await self.save_message_to_database(message, user_id)

        from ..serializers import MessageSerializer
        # Serialize the message instance
        serializer = MessageSerializer(message_instance)
        message_data = serializer.data
        # print(f'message_Data: {message_data}')
        # Send message to chat group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_data
            }
        )


    async def save_message_to_database(self, message, user_id):
        try:
            from ..models import Chat, Message
            from ....user.interactUser.models import InteractUser

            chat = await sync_to_async(Chat.objects.get)(pk=self.chat_id)
            sender = await sync_to_async(InteractUser.objects.get)(pk=user_id)
            
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
            print(f"chat_id={self.chat_id} user_pk={user_id}. An error occurred: {e}")
        return None


    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        # await self.send(text_data=json.dumps(message))
        await self.send(text_data=json.dumps({
            'message': message
        }))