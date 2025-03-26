from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from ..user.models import BaseUser

@receiver(post_save, sender=BaseUser)
def notify_user_on_event(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="New Event",
            message="You have a new event!",
            type="info",
        )
