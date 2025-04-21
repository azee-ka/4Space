# from django.db import models
# from django.contrib.contenttypes.fields import GenericForeignKey
# from django.contrib.contenttypes.models import ContentType
# from ...user.models import BaseUser

# class Collection(models.Model):
#     user = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='collections')
#     name = models.CharField(max_length=255)
#     is_default = models.BooleanField(default=False)

#     def __str__(self):
#         return f"{self.name} ({self.user.username})"


# class CollectionItem(models.Model):
#     collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='items')
#     content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
#     object_id = models.UUIDField()
#     content_object = GenericForeignKey('content_type', 'object_id')
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ('collection', 'content_type', 'object_id')