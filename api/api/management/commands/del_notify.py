# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.notifications.models import Notification

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_users = Notification.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_users[0]} notifications deleted.'))
