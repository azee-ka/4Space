# your_app/management/commands/del_repos.py
from django.core.management.base import BaseCommand
from src.space.repos.models import Repository

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_repos = Repository.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_repos[0]} repos deleted.'))
