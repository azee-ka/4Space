from django.db import models
from django.contrib.auth.models import User
import uuid

class Post(models.Model):
    POST_CATEGORIES = [
        ('quick_thought', 'Quick Thought'),
        ('visual_story', 'Visual Story'),
        ('discussion_thread', 'Discussion Thread'),
        ('deep_dive', 'Deep Dive'),
        ('live_interaction', 'Live Interaction'),
        ('challenge_collab', 'Challenge/Collaboration'),
    ]

    POST_SUBTYPES = [
        # Quick Thought Subtypes
        ('standard', 'Standard Thought'),
        ('flash_debate', 'Flash Debate'),
        ('ai_perspective', 'AI Perspective Challenge'),
        
        # Visual Story Subtypes
        ('moment_capture', 'Moment Capture'),
        ('timelapse_story', 'Timelapse Story'),
        ('quick_reaction', 'Quick Reaction'),
        
        # Discussion Thread Subtypes
        ('classic_discussion', 'Classic Discussion'),
        ('public_reaction', 'Public Reaction'),
        ('media_reaction', 'Media Reaction'),
        ('story_mode', 'Story Mode'),
        
        # Deep Dive Subtypes
        ('formal_article', 'Formal Article'),
        ('peer_review', 'Peer Review'),
        ('crowdsourced_knowledge', 'Crowdsourced Knowledge'),
        
        # Live Interaction Subtypes
        ('live_blog', 'Live Blog'),
        ('live_chat_qa', 'Live Chat Q&A'),
        ('audio_video_debate', 'Audio-Video Debate'),
        
        # Challenge/Collab Subtypes
        ('open_brainstorm', 'Open Brainstorm'),
        ('code_tech_challenge', 'Code/Tech Challenge'),
        ('creative_prompt', 'Creative Prompt'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    community = models.ForeignKey('Community', on_delete=models.CASCADE, null=True, blank=True, related_name='posts')

    category = models.CharField(max_length=30, choices=POST_CATEGORIES, default='discussion_thread')
    subtype = models.CharField(max_length=30, choices=POST_SUBTYPES, default='classic_discussion')

    title = models.CharField(max_length=300, blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    video = models.FileField(upload_to='post_videos/', blank=True, null=True)
    document = models.FileField(upload_to='post_documents/', blank=True, null=True)
    
    poll_options = models.JSONField(blank=True, null=True)  
    poll_results = models.JSONField(blank=True, null=True)  

    ai_summary = models.TextField(blank=True, null=True)  
    engagement_score = models.FloatField(default=0.0)  
    trending_score = models.FloatField(default=0.0)  

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title[:50] if self.title else 'Untitled'}"
