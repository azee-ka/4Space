from django.db import models
from django.utils import timezone
from ..user.models import BaseUser
import uuid
from .metrics import ExchangeMetrics
from .flags import get_flag_weight
from django.db.models import JSONField

def upload_to(instance, filename):
    return f'exchange_banners/{instance.name}/{filename}'

class Exchange(models.Model):
    # === Basic Info ===
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=255, default='Uncategorized')
    tags = models.TextField(blank=True, null=True)  # Keywords/topics
    banner = models.ImageField(upload_to=upload_to, blank=True, null=True)
    rules = models.JSONField(default=list, blank=True)

    # === Membership and Posts ===
    members = models.PositiveIntegerField(default=0)  # Members
    total_entries = models.PositiveIntegerField(default=0)
    moderators = models.ManyToManyField(BaseUser, related_name="moderated_exchanges", blank=True)
    
    # === Metrics (Core Scoring) ===
    upvotes = models.PositiveIntegerField(default=0)  # Upvotes
    downvotes = models.PositiveIntegerField(default=0)  # Downvotes
    net_votes = models.IntegerField(default=0)  # Upvotes - Downvotes
    reactions = models.PositiveIntegerField(default=0)  # Total reactions
    flags = models.JSONField(default=dict, blank=True)  # Detailed moderation flags (see below)
    flagged_content_count = models.PositiveIntegerField(default=0)  # Total flagged content
    flagged_content_ratio = models.FloatField(default=0.0)  # Flagged content / Total content ratio
    verified_content_count = models.PositiveIntegerField(default=0)  # Total verified entries
    verified_content_ratio = models.FloatField(default=0.0)  # Verified content / Total content ratio

    # === Advanced Flags ===
    toxicity_score = models.FloatField(default=0.0)  # Toxicity (0-1)
    misinformation_score = models.FloatField(default=0.0)  # Misinformation spread (0-1)
    echo_chamber_score = models.FloatField(default=0.0)  # Echo chamber potential (0-1)
    spam_score = models.FloatField(default=0.0)  # Spam prevalence (0-1)
    bot_activity_score = models.FloatField(default=0.0)  # Bot activity detection (0-1)
    community_health_score = models.FloatField(default=0.0)  # Aggregate health score (0-1)

    # === Societal Impact ===
    positive_impact_score = models.FloatField(default=0.0)  # Contribution to society
    negative_impact_score = models.FloatField(default=0.0)  # Negative impact (misinfo, toxicity)
    net_impact_score = models.FloatField(default=0.0)  # Positive - Negative impact (scale -1 to 1)

    # === Historical Metrics ===
    historical_data = models.JSONField(default=dict, blank=True)  # Daily activity, post trends
    user_contributions = models.JSONField(default=dict, blank=True)  # User activity breakdown

    # === Permissions ===
    allow_anonymous_posts = models.BooleanField(default=False)  # Anonymous posting
    allow_link_sharing = models.BooleanField(default=True)  # Allow sharing of links
    strict_moderation_mode = models.BooleanField(default=False)  # Enforce strict posting rules

    # === Virtual Tools and Utilities ===
    tools_enabled = models.JSONField(default=dict, blank=True)  # Collaboration tools and settings
    monetization_options = models.JSONField(default=dict, blank=True)  # Ads, funding, etc.
    funding_raised = models.FloatField(default=0.0)  # Total funding raised

    # === Timestamps ===
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # === Creator Info ===
    creator = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, related_name='created_exchanges', null=True)

    def __str__(self):
        return self.name

    def flag_entry(self, flag_type, weight=1):
        """
        Dynamically add a flag to the Exchange.
        :param flag_type: Type of flag (e.g., 'hate_speech', 'spam')
        :param weight: Weight of the flag, default is 1
        """
        if flag_type not in self.flags:
            self.flags[flag_type] = 0
        self.flags[flag_type] += weight
        self.flagged_content_count += 1
        self.save()

    def calculate_all_metrics(self):
        """
        Calculate all relevant metrics and update fields accordingly.
        Uses the ExchangeMetrics class for core calculations.
        """
        metrics = ExchangeMetrics(
            posts=self.entries,  # Assuming each post in the entries counts as a post object
            flags=self.flags,  # Use the flags directly from the model
            members=self.members
        )
        
        # Calculate core metrics
        metrics_summary = metrics.summary()

        # Update the model with calculated metrics
        self.upvotes = metrics_summary.get('engagement_score', 0)  # Placeholder for upvotes
        self.flagged_content_ratio = metrics_summary.get('flagged_content_ratio', 0.0)
        self.verified_content_ratio = metrics_summary.get('verified_content_ratio', 0.0)

        # Update advanced flags metrics
        self.toxicity_score = metrics_summary.get('toxicity_score', 0.0)
        self.misinformation_score = metrics_summary.get('misinformation_score', 0.0)
        self.echo_chamber_score = metrics_summary.get('echo_chamber_score', 0.0)
        self.community_health_score = metrics_summary.get('community_health_score', 0.0)

        # Save the model with new values
        self.save()

    def add_funding(self, amount):
        """
        Add funding raised for the exchange.
        """
        self.funding_raised += amount
        self.save()

    def __str__(self):
        return self.name




class ExchangeMember(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'exchange')


class Entry(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE, related_name='entries')
    author = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, null=True, related_name='authored_entries')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Scoring and Metrics
    upvotes = models.PositiveIntegerField(default=0)  # Total upvotes
    downvotes = models.PositiveIntegerField(default=0)  # Total downvotes
    net_votes = models.IntegerField(default=0)  # Calculated: upvotes - downvotes
    comments_count = models.PositiveIntegerField(default=0)  # Total comments count
    
    # Related Fields
    impact_score = models.OneToOneField('ImpactScore', on_delete=models.CASCADE, related_name='entry_impact_score', blank=True, null=True)
    flags = models.ManyToManyField('Flag', related_name='flagged_entries', blank=True)
    uploaded_files = JSONField(default=list, blank=True)

    def update_metrics(self):
        """
        Update the metrics for the entry such as net votes and comments count.
        """
        self.net_votes = self.upvotes - self.downvotes
        self.comments_count = self.comments.count()
        self.save()

    @property
    def all_comments(self):
        """
        Retrieve all comments (including nested replies) for this entry.
        """
        return self.comments.all()

    def __str__(self):
        return self.title


class EntryVote(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE)
    vote_type = models.CharField(choices=[('upvote', 'Upvote'), ('downvote', 'Downvote')], max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'entry')  # Ensures a user can only vote once per entry

    def __str__(self):
        return f"{self.user.username} voted {self.vote_type} on {self.entry.title}"

class ExchangeVote(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE, related_name="votes")
    vote_type = models.CharField(choices=[('upvote', 'Upvote'), ('downvote', 'Downvote')], max_length=8)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'exchange')  # Ensures a user can only vote once per entry

    def __str__(self):
        return f"{self.user.username} voted {self.vote_type} on {self.exchange.title}"


class Comment(models.Model):
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    score = models.IntegerField(default=0)
    parent_comment = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def __str__(self):
        if self.parent_comment:
            return f'Reply by {self.author.get_current_username()} on comment ID {self.parent_comment.id}'
        return f'Comment by {self.author.get_current_username()} on {self.entry.title}'
    
class CommentVote(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
    vote_type = models.CharField(choices=[('upvote', 'Upvote'), ('downvote', 'Downvote')], max_length=8)

    class Meta:
        unique_together = ('user', 'comment')  # Prevent multiple votes by the same user

    def __str__(self):
        return f"{self.user.username} voted {self.vote_type} on comment ID {self.comment.id}"



class Score(models.Model):
    SCORE_CHOICES = [
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
    ]
    content_type = models.CharField(max_length=50)
    content_id = models.IntegerField()
    score_type = models.CharField(max_length=10, choices=SCORE_CHOICES)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'{self.score_type} for {self.content_type} with ID {self.content_id}'

class Flag(models.Model):
    FLAG_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate'),
        ('offensive', 'Offensive'),
        ('other', 'Other'),
    ]
    content_type = models.CharField(max_length=50)
    content_id = models.IntegerField()
    reason = models.CharField(max_length=50, choices=FLAG_CHOICES)
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE, related_name='flags')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'Flag for {self.content_type} {self.content_id} by {self.user.get_current_username()}'

class ImpactScore(models.Model):
    entry = models.OneToOneField(Entry, on_delete=models.CASCADE, related_name='impact_score_detail')  # changed related_name
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)
    engagement_score = models.IntegerField(default=0)

    def calculate_engagement(self):
        self.engagement_score = self.upvotes * 3 + self.comments * 2 + self.shares * 5
        self.save()

    def __str__(self):
        return f'Impact score for entry {self.entry.title}'