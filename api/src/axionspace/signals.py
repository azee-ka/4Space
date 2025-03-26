from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Entry, Comment, Score

@receiver(post_save, sender=Comment)
@receiver(post_delete, sender=Comment)
def update_entry_comments_count(sender, instance, **kwargs):
    """
    Update the comments count of the related entry whenever a comment is added or removed.
    """
    entry = instance.entry
    entry.update_metrics()

@receiver(post_save, sender=Score)
def update_entry_votes(sender, instance, **kwargs):
    """
    Update the upvotes, downvotes, and net votes for the related entry whenever a score is updated.
    """
    entry = Entry.objects.get(id=instance.content_id)
    if instance.score_type == 'upvote':
        entry.upvotes += 1
    elif instance.score_type == 'downvote':
        entry.downvotes += 1
    entry.update_metrics()
