# src/collection/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from src.user.models import BaseUser
from .models import Collection

@receiver(post_save, sender=BaseUser)
def create_default_collection(sender, instance, created, **kwargs):
    if created:
        Collection.objects.create(
            owner=instance,
            title='Bookmarks',
            description='',
            visibility='private'
        )
