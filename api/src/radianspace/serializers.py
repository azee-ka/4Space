from rest_framework import serializers
from .models import Flare, Comment, MediaFile, Vote
from django.core.files.base import ContentFile
from moviepy import VideoFileClip
from PIL import Image
from io import BytesIO
import os
from django.core.files.storage import default_storage
from django.conf import settings

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['user', 'comment', 'vote_type']



class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    upvotes_count = serializers.SerializerMethodField()
    downvotes_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    vote_status = serializers.SerializerMethodField()
    like_status = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'text', 'created_at', 'parent_comment', 'likes_count', 
                  'upvotes_count', 'downvotes_count', 'replies', 'vote_status', 'like_status']

    def get_upvotes_count(self, obj):
        return Vote.upvotes(obj).count()

    def get_downvotes_count(self, obj):
        return Vote.downvotes(obj).count()

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.all(), many=True).data

    def get_author(self, obj):
        author = obj.author
        return {
            'username': author.username,
            'profile_image': author.profile_image.url if author.profile_image else None,
        }

    def get_vote_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if Vote.objects.filter(user=user, comment=obj, vote_type='upvote').exists():
                return 'upvoted'
            elif Vote.objects.filter(user=user, comment=obj, vote_type='downvote').exists():
                return 'downvoted'
        return 'none'

    def get_like_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if user in obj.likes.all():
                return 'liked'
            return 'not_liked'
        return 'none'

    def get_likes_count(self, obj):
        """
        Returns the total number of likes on the comment.
        """
        return obj.likes.count()
        
        
    
class MediaFileSerializer(serializers.ModelSerializer):
    media_type = serializers.CharField()
    file = serializers.FileField()
    quality = serializers.CharField()
    video_qualities = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = ['file', 'media_type', 'quality', 'video_qualities']

    def get_video_qualities(self, obj):
        """Return available video qualities (144p, 240p, 360p, etc.)"""
        # We check if the media type is video, and if so, generate video qualities
        if obj.media_type == 'video':
            return obj.get_video_qualities()  # This method will return the list of qualities

        return []  # If not a video, return an empty list
        
        
        
class FlareSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    profile_image = serializers.ImageField(source='user.profile_image', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    like_status = serializers.SerializerMethodField()
    dislike_status = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    media_files = MediaFileSerializer(many=True, read_only=False, required=False)

    class Meta:
        model = Flare
        fields = [
            'text',
            'media_files',
            'id',
            'author',
            'profile_image',
            'created_at',
            'likes',
            'dislikes',
            'comments',
            'like_status',
            'dislike_status',
            'likes_count',
            'dislikes_count',
        ]

    def get_author(self, obj):
        author = obj.author
        return {
            'username': author.username,
            'profile_image': author.profile_image.url if author.profile_image else None,
        }

    def get_likes(self, obj):
        return [
            {
                'username': like.username,
                'profile_image': like.profile_image.url if like.profile_image else None,
            }
            for like in obj.likes.all()
        ]

    def get_dislikes(self, obj):
        return [
            {
                'username': dislike.username,
                'profile_image': dislike.profile_image.url if dislike.profile_image else None,
            }
            for dislike in obj.dislikes.all()
        ]

    def get_like_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if user in obj.likes.all():
                return 'liked'
            return 'not_liked'
        return 'none'

    def get_dislike_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if user in obj.dislikes.all():
                return 'disliked'
            return 'not_disliked'
        return 'none'

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_dislikes_count(self, obj):
        return obj.dislikes.count()






class MinimalFlareSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    media_files_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Flare
        fields = ['thumbnail', 'uuid', 'media_files_count']
        
    def get_media_files_count(self, obj):
        """ Return the count of media files associated with this Flare object. """
        return obj.media_files.count() 

    def get_thumbnail(self, obj):
        # Assuming 'media_files' is a related manager on the Flare model
        thumbnail_media_file = obj.media_files.first()
        if not thumbnail_media_file:
            return None

        if thumbnail_media_file.media_type == 'image':
            return {
                'file': thumbnail_media_file.file.url,
                'media_type': thumbnail_media_file.media_type,
            }
            
        if thumbnail_media_file.media_type == 'video':
            try:
                thumbnail_image = self.generate_video_thumbnail(thumbnail_media_file.file)
                if thumbnail_image:
                    temp_thumbnail_name = f"thumbnail_{obj.uuid}.jpg"
                    thumbnail_path = os.path.join('thumbnails', temp_thumbnail_name)
                    saved_thumbnail = default_storage.save(thumbnail_path, ContentFile(thumbnail_image))
                    return {
                        'file': default_storage.url(saved_thumbnail),
                        'media_type': 'video',
                    }
            except Exception as e:
                print(f"Error generating thumbnail for video: {e}")

        return None

    def generate_video_thumbnail(self, video_file):
        try:
            # Load the video file
            video_clip = VideoFileClip(video_file.path)
            
            # Extract the first frame from the video
            frame = video_clip.get_frame(0)
            
            # Convert the frame to a PIL image
            image = Image.fromarray(frame)
            
            # Save the image to a BytesIO stream in PNG format for lossless quality
            byte_io = BytesIO()
            image.save(byte_io, format='PNG')  # PNG format to maintain quality
            byte_io.seek(0)
            
            # Return the image bytes
            return byte_io.read()
        except Exception as e:
            print(f"Error processing video file: {e}")
            return None

    
    
    
    
    
class TimelineFlareSerializer(serializers.ModelSerializer):

    class Meta:
        model = Flare
        fields = ['uuid']