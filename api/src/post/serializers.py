from rest_framework import serializers
from .models import ThreadPost, VisualPost, MediaFile, Vote, Comment
from ..user.models import BaseUser
from django.contrib.contenttypes.models import ContentType
from ..user.serializers import EssentialUserSerializer
from django.core.files.base import ContentFile
import os
from moviepy import VideoFileClip
from PIL import Image
from io import BytesIO
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
        fields = [
            'id', 'author', 'text', 'created_at', 'parent_comment', 'likes_count',
            'upvotes_count', 'downvotes_count', 'replies', 'vote_status', 'like_status'
        ]

    def create(self, validated_data):
        """ Handle setting content_type and object_id correctly at creation time """
        request = self.context.get('request')
        post = self.context.get('post')
        
        comment = Comment(
            author=request.user,
            text=validated_data['text'],
            content_type=ContentType.objects.get_for_model(post),
            object_id=post.id,
            parent_comment=validated_data.get('parent_comment')
        )
        comment.save()
        return comment

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
        
        
# Media Serializer
class MediaFileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    video_qualities = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = ['file', 'media_type', 'quality', 'video_qualities']

    def get_file(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_video_qualities(self, obj):
        if obj.media_type == 'video':
            return obj.get_video_qualities()
        return []

# Base Serializer
class BasePostSerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    post_type = serializers.SerializerMethodField()
    comments_count = serializers.IntegerField(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    dislikes_count = serializers.IntegerField(read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta:
        model = None  # Abstract
        fields = [
            'id', 'author', 'visibility', 'restriction', 'comments_setting',
            'created_at', 'updated_at', 'post_type',
            'comments_count', 'likes_count', 'dislikes_count', 'comments',
        ]

    def get_post_type(self, obj):
        return obj.__class__.__name__.replace("Post", "")

    def get_comments(self, obj):
        request = self.context.get('request')
        comments = obj.comments.filter(parent_comment__isnull=True).order_by('-created_at')
        return CommentSerializer(comments, many=True, context={'request': request}).data

# ThreadPost
class ThreadPostSerializer(BasePostSerializer):
    content = serializers.CharField()
    media_files = serializers.SerializerMethodField()

    # Add poll fields
    poll_question = serializers.CharField(required=False, allow_blank=True)
    poll_options = serializers.ListField(child=serializers.CharField(), required=False)
    poll_expiration_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta(BasePostSerializer.Meta):
        model = ThreadPost
        fields = BasePostSerializer.Meta.fields + [
            'content', 'media_files',
            'poll_question', 'poll_options', 'poll_expiration_date'
        ]

    def get_media_files(self, obj):
        request = self.context.get('request')
        return MediaFileSerializer(obj.media_files.all(), many=True, context={'request': request}).data


# VisualPost
class VisualPostSerializer(BasePostSerializer):
    caption = serializers.CharField(allow_blank=True, required=False)
    media_files = serializers.SerializerMethodField()

    class Meta(BasePostSerializer.Meta):
        model = VisualPost
        fields = BasePostSerializer.Meta.fields + ['caption', 'media_files']

    def get_media_files(self, obj):
        request = self.context.get('request')
        return MediaFileSerializer(obj.media_files.all(), many=True, context={'request': request}).data

# Post Creation Serializer
class PostCreateSerializer(serializers.Serializer):
    post_type = serializers.ChoiceField(choices=[('Thread', 'Thread'), ('Visual', 'Visual')])
    author = serializers.SlugRelatedField(slug_field='username', queryset=BaseUser.objects.all())
    visibility = serializers.ChoiceField(choices=ThreadPost.VISIBILITY_CHOICES, default='Private')
    restriction = serializers.ChoiceField(choices=ThreadPost.RESTRICTION_CHOICES, default='SFW')
    comments_setting = serializers.ChoiceField(choices=ThreadPost.COMMENTS_CHOICES, default='Allow')
    content = serializers.CharField(required=False, allow_blank=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    media_files = serializers.ListField(child=serializers.FileField(), required=False)

    def create(self, validated_data):
        post_type = validated_data.pop('post_type')
        author = validated_data.pop('author')
        media_files_data = validated_data.pop('media_files', [])

        # Clean fields properly
        content = validated_data.pop('content', None)
        caption = validated_data.pop('caption', None)

        if post_type == 'Thread':
            if not content:
                raise serializers.ValidationError('Thread post must have content.')
            post = ThreadPost.objects.create(
                author=author,
                content=content,
                visibility=validated_data.get('visibility', 'Private'),
                restriction=validated_data.get('restriction', 'SFW'),
                comments_setting=validated_data.get('comments_setting', 'Allow'),
            )
            for uploaded_file in media_files_data:
                media = MediaFile.objects.create(file=uploaded_file)
                post.media_files.add(media)
            return post

        elif post_type == 'Visual':
            if not media_files_data:
                raise serializers.ValidationError('Visual post must have at least one media file.')
            post = VisualPost.objects.create(
                author=author,
                caption=caption or "",
                visibility=validated_data.get('visibility', 'Private'),
                restriction=validated_data.get('restriction', 'SFW'),
                comments_setting=validated_data.get('comments_setting', 'Allow'),
            )
            for uploaded_file in media_files_data:
                media = MediaFile.objects.create(file=uploaded_file)
                post.media_files.add(media)
            return post

        raise serializers.ValidationError('Invalid post type.')


    def get_media_files(self, obj):
        request = self.context.get('request')  # ⚡ get the request from context
        return MediaFileSerializer(obj.media_files.all(), many=True, context={'request': request}).data

class MinimalVisualPostSerializer(VisualPostSerializer):
    thumbnail = serializers.SerializerMethodField()
    media_files_count = serializers.SerializerMethodField()
    
    class Meta:
        model = VisualPost
        fields = ['thumbnail', 'created_at', 'id', 'media_files_count', 'post_type']
        post_type = 'Visual'
        
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
                    temp_thumbnail_name = f"thumbnail_{obj.id}.jpg"
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

