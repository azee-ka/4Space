from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async, async_to_sync
from channels.layers import get_channel_layer
from ..models import Chat, Message, ChatParticipant
from ..serializers import MessageSerializer
from ....user.timelineUser.models import TimelineUser
from ....user.baseUser.models import BaseUser
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_uuid = self.scope['url_route']['kwargs']['uuid']
        self.room_group_name = f'chat_{self.chat_uuid}'
        self.room_group_name_unrestricted = f'chat_{self.chat_uuid}_unrestricted'
        
        # Join chat group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        # Accept the WebSocket connection
        await self.accept()


    async def disconnect(self, close_code):
        # Leave chat group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            self.room_group_name_unrestricted,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'send_message':
            await self.handle_send_message(data)
        elif action == 'accept_invitation':
            await self.handle_accept_invitation(data)
        
    async def handle_send_message(self, data):
        message = data['message']
        user_id = data.get('user_id')  # Get the user ID from the message

        # Fetch the chat and check if the user is allowed to send messages
        chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
        participant = await sync_to_async(BaseUser.objects.get)(id=user_id)
        participant = await sync_to_async(lambda: participant.interactuser.timeline_user)()
        print('participant', type(participant))
        participant_in_chat = await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).exists)()
        print('participant232', type(participant))
        is_restricted = await sync_to_async(lambda: ChatParticipant.objects.get(chat=chat, participant=participant).restricted)()

        # Check if the user is the inviter
        is_inviter = await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant, is_inviter=True).exists)()

        # Check if the user has accepted the invitation
        accepted_invites = await sync_to_async(ChatParticipant.objects.filter(chat=chat, accepted=True).exclude(is_inviter=True).count)()
        print('participant7675', type(participant))
        # Check if the user is allowed to send messages
        if is_inviter:
            if accepted_invites > 0:
                # If the inviter and at least one participant have accepted, remove restriction
                await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).update)(restricted=False)

            elif await sync_to_async(chat.messages.count)() >= 3:
                # If the inviter has sent 3 messages and no one has accepted, remove restriction for inviter only
                await sync_to_async(ChatParticipant.objects.filter(chat=chat, participant=participant).update)(restricted=False)
                
        
            # Check if the inviter is now unrestricted and add the user to the unrestricted group
        print(f"is_restricted {user_id} : {is_restricted}")
        if not is_restricted:
            await self.channel_layer.group_add(
                self.room_group_name_unrestricted,
                self.channel_name
            )
            
        if is_inviter and accepted_invites == 0 and await sync_to_async(chat.messages.count)() < 3:
            # Save message to database
            message_instance = await self.save_message_to_database(message, user_id)
            message_data = None
            if message_instance:
                try:
                    print("hello232323232")
                    message_data = await sync_to_async(lambda: MessageSerializer(message_instance).data)()
                
                    # Send message to chat group
                    print('participant2323232323')
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': message_data
                        }
                    )
                except Exception as e:
                    print(f"message_data {message_data}. An error occurred: {e}")
                    
        elif accepted_invites > 0:
            print(f"hello5 {accepted_invites}")
            if not is_restricted:
                # Save message to database
                message_instance = await self.save_message_to_database(message, user_id)
                message_data = None
                if message_instance:
                    try:
                        print(f"hello10121--1-1 {message_instance}")
                        message_data = await sync_to_async(lambda: MessageSerializer(message_instance).data)()
                        # Send message to WebSocket
                        print("hello10121")
                        await self.channel_layer.group_send(
                            self.room_group_name_unrestricted,
                            {
                                'type': 'chat_message',
                                'message': message_data
                            }
                        )
                    except Exception as e:
                        print(f"message_data {message_data}. An error occurred: {e}")
                else:
                    print("Message not sent to unrestricted user. Is the user still restricted?")
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


    async def handle_accept_invitation(self, data):
        user_id = data.get('user_id')
        chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
        
        # Retrieve the inviter's ChatParticipant instance
        inviter_participant = await sync_to_async(ChatParticipant.objects.get)(
            chat=chat,
            is_inviter=True
        )
        
        # Set the inviter's restricted attribute to False if it's True
        if inviter_participant.restricted:
            inviter_participant.restricted = False
            await sync_to_async(inviter_participant.save)()
            
        participant, created = await sync_to_async(ChatParticipant.objects.get_or_create)(
            chat=chat, 
            participant_id=user_id, 
            defaults={'accepted': True, 'restricted': False}
        )

        if not created:
            participant.accepted = True
            participant.restricted = False
            await sync_to_async(participant.save)()

        await self.channel_layer.group_add(
            self.room_group_name_unrestricted,
            self.channel_name
        )
        print(f"User {user_id} accepted the invitation and was added to unrestricted group {self.room_group_name_unrestricted}")







    async def save_message_to_database(self, message, user_id):
        try:
            print('save_message_to_database')
            chat = await sync_to_async(Chat.objects.get)(uuid=self.chat_uuid)
            print(f'save_message_to_database3399992 {chat}')

            sender = await sync_to_async(BaseUser.objects.get)(id=user_id)
            print(f'save_message_to_database3399992--1-1 {type(sender)}')

            # Fetch interact user asynchronously
            interact_user_sender = await sync_to_async(lambda: sender.interactuser)()
            print(f'interact_user_sender--1-1 {type(interact_user_sender)}')

            # Fetch timeline user asynchronously
            timeline_user_sender = await sync_to_async(lambda: interact_user_sender.timeline_user)()
            print(f'timeline_user_sender {type(timeline_user_sender)}')

            # Create message instance asynchronously
            message_instance = Message(chat=chat, sender=timeline_user_sender, content=message)  # Fixed line
            print(f'save_message_to_database32347343432 {sender}')
            await sync_to_async(message_instance.save)()
            print(f'saved to db {sender}')

            return message_instance
        except BaseUser.DoesNotExist:
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
