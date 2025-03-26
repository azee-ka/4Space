# your_app/management/commands/delete_all.py
from django.core.management.base import BaseCommand
from src.axionspace.models import Exchange, Entry, Comment, Score, Flag, ImpactScore, ExchangeMember

class Command(BaseCommand):
    help = 'Deletes all instances of the models'

    def handle(self, *args, **kwargs):
        # Deleting all instances of models
        deleted_exchanges = Exchange.objects.all().delete()
        deleted_entries = Entry.objects.all().delete()
        deleted_comments = Comment.objects.all().delete()
        deleted_scores = Score.objects.all().delete()
        deleted_flags = Flag.objects.all().delete()
        deleted_impact_scores = ImpactScore.objects.all().delete()
        deleted_exchange_members = ExchangeMember.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f'{deleted_exchanges[0]} exchanges deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_entries[0]} entries deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_comments[0]} comments deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_scores[0]} scores deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_flags[0]} flags deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_impact_scores[0]} impact scores deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{deleted_exchange_members[0]} exchange members deleted.'))
