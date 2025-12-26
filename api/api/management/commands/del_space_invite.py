# api/api/management/commands/del_space_invite.py
from django.core.management.base import BaseCommand
from src.space.space.models import SpaceInvitation

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_space_invitations = SpaceInvitation.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_space_invitations[0]} space invitations deleted.'))
