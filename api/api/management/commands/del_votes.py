# your_app/management/commands/delete_votes.py
from django.core.management.base import BaseCommand
from src.post.models import Vote

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_votes = Vote.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_votes[0]} votes deleted.'))
