# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.utils.models import Mention, Hashtag, ExchangeReference

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        mention = Mention.objects.all().delete()
        hashtag = Hashtag.objects.all().delete()
        exchange_ref = ExchangeReference.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{mention[0]} mentions deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{hashtag[0]} hashtag deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{exchange_ref[0]} exchange references deleted.'))
