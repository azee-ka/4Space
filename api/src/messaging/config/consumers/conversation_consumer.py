# src/consumers/conversation_consumer.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from src.messaging.models import Conversation
from src.user.models import BaseUser
from asgiref.sync import sync_to_async

class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_group_name = f"user_{self.user.username}"
        
        # Join room group for the user
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def new_conversation(self, event):
        # This event can be sent from a producer (e.g., views when a new conversation is created)
        await self.send(text_data=json.dumps({
            'type': 'new_conversation',
            'uuid': event['uuid'],
            'created_at': event['created_at'],
            'group_participant_count': event['group_participants_count'],
            'other_participant': event['other_participant'],
        }))
