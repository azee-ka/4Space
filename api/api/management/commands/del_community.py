# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.community.models import Community

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_communities = Community.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_communities[0]} communities deleted.'))
