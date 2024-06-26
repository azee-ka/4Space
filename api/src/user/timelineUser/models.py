from django.db import models
from ..baseUser.models import BaseUser
from ...post.models import Post

class TimelineUser(models.Model):
    user = models.OneToOneField(BaseUser, on_delete=models.CASCADE, primary_key=True)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following')
    connections = models.ManyToManyField('self', symmetrical=True)
    is_private_profile = models.BooleanField(default=False)
    posts = models.ManyToManyField(Post, related_name='posted_by', blank=True)
    follow_requests = models.ManyToManyField('self', symmetrical=False, related_name='sent_follow_requests', blank=True)
    
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

    def accept_follow_request(self, user):
        self.follow_requests.remove(user)
        self.add_follower(user)

    def __str__(self):
        return self.user.username

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

    def accept_follow_request(self, user):
        self.follow_requests.remove(user)
        self.add_follower(user)

    def __str__(self):
        return self.user.username
