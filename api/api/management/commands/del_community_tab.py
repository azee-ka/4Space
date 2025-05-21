# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.community.models import CommunityTab

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_community_tabs = CommunityTab.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_community_tabs[0]} community tabs deleted.'))
