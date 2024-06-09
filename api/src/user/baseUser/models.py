from django.db import models
from django.contrib.auth.models import AbstractUser

def upload_to(instance, filename):
    return f'profile_pictures/{instance.username}/{filename}'

class BaseUser(AbstractUser):
    username = models.CharField(unique=True, max_length=150)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to=upload_to, blank=True, null=True)
    active_profile = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='%(app_label)s_%(class)s_active_profile')