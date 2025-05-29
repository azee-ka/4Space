# src/post/management/commands/delete_all_posts.py

from django.core.management.base import BaseCommand
from src.post.models import ThreadPost, VisualPost

class Command(BaseCommand):
    help = 'Deletes all post instances (ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost)'

    def handle(self, *args, **kwargs):
        # Delete all instances of each post type
        threads = ThreadPost.objects.all().delete()
        visuals = VisualPost.objects.all().delete()

        # Output how many were deleted
        self.stdout.write(self.style.SUCCESS(f'{threads[0]} thread posts deleted.'))
        self.stdout.write(self.style.SUCCESS(f'{visuals[0]} visual posts deleted.'))
