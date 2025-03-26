import uuid
from django.db import models
from ..user.models import BaseUser
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import json

class Report(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('phishing', 'Phishing'),
        ('misleading_information', 'Misleading Information'),
        ('bullying', 'Bullying'),
        ('threats', 'Threats'),
        ('stalking', 'Stalking'),
        ('hate_speech', 'Hate Speech'),
        ('violent_content', 'Violent Content'),
        ('sexual_content', 'Sexual Content'),
        ('doxxing', 'Doxxing'),
        ('unauthorized_sharing', 'Unauthorized Sharing'),
        ('impersonation', 'Impersonation'),
        ('scams_or_fraud', 'Scams or Fraud'),
        ('malware_or_viruses', 'Malware or Viruses'),
        ('other', 'Other'),
    ]

    reporter = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='reports')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=100)
    content_object = GenericForeignKey('content_type', 'object_id')
    reasons = models.JSONField(default=list)  # Store multiple reasons
    custom_reason = models.TextField(blank=True, null=True)  # For custom reasons under "Other"
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reporter', 'content_type', 'object_id')

