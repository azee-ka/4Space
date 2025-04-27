from django.db import models
from django.utils import timezone
import re
from django.db.models import Model
from django.contrib.contenttypes.models import ContentType    
from django.contrib.contenttypes.fields import GenericForeignKey

class Mention(models.Model):
    user = models.ForeignKey('user.BaseUser', on_delete=models.CASCADE, related_name='mentions')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)



    def __str__(self):
        return f'@{self.username} mentioned in {self.content_type} {self.content_id}'

class Hashtag(models.Model):
    name = models.CharField(max_length=255, unique=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f'#{self.hashtag} in {self.content_type} {self.content_id}'
