# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.quantaspace.models import Packet

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        flares = Packet.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{flares[0]} page packets deleted.'))
