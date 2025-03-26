from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

def upload_to(instance, filename):
    return f'profile_pictures/{instance.username}/{filename}'

class BaseUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with an email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class BaseUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    username_anon = models.CharField(max_length=150, unique=True, null=True, blank=True)
    username_pro = models.CharField(max_length=150, unique=True, null=True, blank=True)
    role = models.CharField(
        max_length=50, 
        choices=[('anonymous', 'Anonymous'), ('professional', 'Professional')],
        blank=True,
        null=True
    )
    display_name = models.CharField(max_length=150, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    about_me = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=[('Male', 'Male'), ('Female', 'Female'), ('undisclosed', 'Prefer not to disclose')],
        blank=True,
        null=True
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
        
    followers = models.ManyToManyField('self', related_name='followed_by', symmetrical=False, blank=True)
    following = models.ManyToManyField('self', related_name='following_by', symmetrical=False, blank=True)
    
    # Profile visibility settings
    is_private_profile = models.BooleanField(default=False)
    profile_settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="Customize visibility for profile fields (e.g., {'bio': 'public', 'email': 'private'})"
    )

    objects = BaseUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []


    def get_profile_for_viewer(self, viewer):
        """
        Returns profile data based on whether the viewer is the user themselves, 
        a follower, or a general public viewer.
        """
        if viewer == self:
            return {field: getattr(self, field, None) for field in self.MY_PROFILE_FIELDS}
        elif viewer in self.followers.all():
            return self.get_private_profile(viewer)
        else:
            return self.get_public_profile()

    def get_current_username(self):
        return self.username
    
    def get_all_entries(self):
        """
        Returns all entries created by the user.
        """
        return self.authored_entries.all()
    
    def is_following(self, user):
        """
        Check if the current user is following the given user.
        
        Args:
            user (BaseUser): The user to check against.
        
        Returns:
            bool: True if the current user is following the given user, False otherwise.
        """
        return self.following.filter(id=user.id).exists()
    
    def __str__(self):
        return self.email

