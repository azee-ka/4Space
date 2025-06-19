# src/user/models.py

import uuid
from django.conf import settings
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.db.models.signals import post_save
from django.dispatch import receiver


def upload_to(instance, filename):
    return f'profile_pictures/{instance.username}/{filename}'


class AuthUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        """
        Create and return a regular AuthUser with username, email, names, and password.
        """
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """
        Create and return a superuser with a username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)


class AuthUser(AbstractBaseUser, PermissionsMixin):
    """
    The real Django user for authentication.  Holds email & name (static),
    plus the FK to the active BaseUser handle.
    """
    username       = models.CharField(max_length=150, unique=True)
    email          = models.EmailField(unique=False, null=True, blank=True)
    first_name     = models.CharField(max_length=150, blank=True, null=True)
    last_name      = models.CharField(max_length=150, blank=True, null=True)

    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    is_superuser   = models.BooleanField(default=False)
    date_joined    = models.DateTimeField(auto_now_add=True)

    # Which handle is currently active
    active_handle  = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,      # 'user.BaseUser'
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='+'
    )

    objects        = AuthUserManager()
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []  # we collect email/names manually if you like

    def __str__(self):
        return self.username



class BaseUser(models.Model):
    """
    A “handle” under an AuthUser account.  All profile/content logic points here.
    """
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account          = models.ForeignKey(
                          settings.AUTH_USER_MODEL,   # 'user.AuthUser'
                          related_name='handles',
                          on_delete=models.CASCADE
                      )

    username           = models.CharField(max_length=150, unique=True)
    label            = models.CharField(
                          max_length=50,
                          blank=True, null=True,
                          help_text="e.g. 'main', 'work', 'anon'"
                      )
    display_name     = models.CharField(max_length=150, blank=True, null=True)
    profile_image    = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    about_me         = models.TextField(blank=True, null=True)
    date_of_birth    = models.DateField(null=True, blank=True)
    gender           = models.CharField(
                          max_length=20,
                          choices=[('Male','Male'),('Female','Female'),('undisclosed','Prefer not to disclose')],
                          blank=True, null=True
                      )
    role             = models.CharField(
                          max_length=50,
                          choices=[('anonymous','Anonymous'),('professional','Professional')],
                          blank=True, null=True
                      )
    is_org_owner     = models.BooleanField(default=False)
    is_verified      = models.BooleanField(default=False)
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    date_joined      = models.DateTimeField(auto_now_add=True)

    followers        = models.ManyToManyField(
                          'self', related_name='followed_by',
                          symmetrical=False, blank=True
                       )
    following        = models.ManyToManyField(
                          'self', related_name='following_by',
                          symmetrical=False, blank=True
                       )

    # Profile visibility settings
    is_private_profile = models.BooleanField(default=False)
    profile_settings   = models.JSONField(
                             default=dict, blank=True,
                             help_text="Customize visibility for profile fields"
                         )

    class Meta:
        ordering = ['date_joined']

    def get_profile_for_viewer(self, viewer):
        if viewer == self:
            return {f: getattr(self, f, None) for f in self.MY_PROFILE_FIELDS}
        elif viewer in self.followers.all():
            return self.get_private_profile(viewer)
        else:
            return self.get_public_profile()

    def get_current_username(self):
        return self.handle

    def get_all_entries(self):
        return self.authored_entries.all()

    def is_following(self, other):
        return self.following.filter(id=other.id).exists()

    def get_full_name(self):
        # Delegates to AuthUser if you need it:
        return f"{self.first_name or ''} {self.last_name or ''}".strip()

    def __str__(self):
        return f"{self.username}"

    def clean(self):
        if self.account.handles.exclude(pk=self.pk).count() >= 4:
            from django.core.exceptions import ValidationError
            raise ValidationError("You may only have up to 4 handles per account")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # auto‐set first handle as default
        if not self.account.active_handle:
            self.account.active_handle = self
            self.account.save(update_fields=['active_handle'])

    def __getattr__(self, name):
        """
        Delegate any missing attributes (e.g. email, first_name, last_name)
        back to the underlying AuthUser.
        """
        return getattr(self.account, name)



@receiver(post_save, sender=AuthUser)
def create_primary_handle(sender, instance, created, **kwargs):
    """
    On signup of an AuthUser, create the matching BaseUser handle.
    """
    if created:
        h = BaseUser.objects.create(
            account      = instance,
            username     = instance.username,
            label        = 'main',
            display_name = instance.username,
        )
        instance.active_handle = h
        instance.save(update_fields=['active_handle'])
