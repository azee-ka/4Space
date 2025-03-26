# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.messaging.models import Message, Conversation

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        messages = Message.objects.all().delete()
        conversations = Conversation.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{messages[0]} messages deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{conversations[0]} conversations deleted.'))
