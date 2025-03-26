from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BaseUser
from src.messaging.models import MessageSettings

@receiver(post_save, sender=BaseUser)
def create_message_settings(sender, instance, created, **kwargs):
    if created:
        # Create message settings when a new user is created
        MessageSettings.objects.create(user=instance)
