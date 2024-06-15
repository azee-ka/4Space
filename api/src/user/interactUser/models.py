from django.db import models
from ..baseUser.models import BaseUser
from ...post.models import Post

class InteractUser(BaseUser):
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following')
    connections = models.ManyToManyField('self', symmetrical=True)
    is_private_profile = models.BooleanField(default=False)
    posts = models.ManyToManyField(Post, related_name='posted_by', blank=True)
    follow_requests = models.ManyToManyField('self', symmetrical=False, related_name='follow_requests_received', blank=True)
    
    def add_follower(self, user):
        self.followers.add(user)

    def remove_follower(self, user):
        self.followers.remove(user)

    def add_connection(self, user):
        self.connections.add(user)
        user.connections.add(self)

    def remove_connection(self, user):
        self.connections.remove(user)
        user.connections.remove(self)
        
    def send_follow_request(self, user):
        self.follow_requests.add(user)
        from ...components.notification.models import Notification
        Notification.objects.create(
            recipient=user,
            actor=self,
            verb='sent you a follow request'
        )

    def accept_follow_request(self, user):
        self.follow_requests.remove(user)
        self.add_follower(user)


    def __str__(self):
        return self.base_user.username