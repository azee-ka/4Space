from django.db import models
from community.models import Community
import uuid

class FundingRound(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='funding_rounds')
    round_name = models.CharField(max_length=100)  # e.g., Seed, Series A
    amount_raised = models.DecimalField(max_digits=12, decimal_places=2)
    investors = models.TextField()
    announced_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-announced_on']
