from rest_framework import serializers
from .models import BasePost, ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost, MediaFile
from ..user.models import BaseUser

    
class MediaFileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    media_type = serializers.CharField()
    quality = serializers.CharField()
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
        """Return available video qualities (144p, 240p, 360p, etc.)"""
        # We check if the media type is video, and if so, generate video qualities
        if obj.media_type == 'video':
            return obj.get_video_qualities()  # This method will return the list of qualities

        return []  # If not a video, return an empty list
    
    
POST_TYPE_REGISTRY = {}

class RegisteredPostSerializer(serializers.ModelSerializer):
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        
        # Read post_type from Meta
        post_type = getattr(cls.Meta, 'post_type', None)
        if not post_type:
            raise TypeError(f"{cls.__name__} must define a 'post_type' inside Meta.")
        
        POST_TYPE_REGISTRY[post_type] = cls
        cls.post_type = post_type  # Set for convenience



class BasePostSerializer(serializers.ModelSerializer):
    user = serializers.SlugRelatedField(
        slug_field='username',
        read_only=True
    )
    post_type = serializers.SerializerMethodField()


    class Meta:
        model = BasePost  # abstract, not used directly
        fields = [
            'id', 'user',
            'visibility', 'restriction', 'comments_setting',
            'created_at', 'updated_at',
            'post_type'
        ]

    def get_post_type(self, obj):
        return obj.__class__.__name__.replace("Post", "")


class ThreadPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    content = serializers.CharField()
    
    class Meta(BasePostSerializer.Meta):
        model = ThreadPost
        fields = BasePostSerializer.Meta.fields + ['content']
        post_type = 'Thread'


class VisualPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    content = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    media_files = serializers.SerializerMethodField()  # 🛠 NOT direct input, just output.

    class Meta(BasePostSerializer.Meta):
        model = VisualPost
        fields = BasePostSerializer.Meta.fields + ['content', 'media_files']
        post_type = 'Visual'

    def get_media_files(self, obj):
        request = self.context.get('request')  # ⚡ get the request from context
        return MediaFileSerializer(obj.media_files.all(), many=True, context={'request': request}).data




class PollPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    expiration_date = serializers.DateTimeField()

    class Meta(BasePostSerializer.Meta):
        model = PollPost
        fields = BasePostSerializer.Meta.fields + ['question', 'options', 'expiration_date']
        post_type = 'Poll'


class StoryPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    content = serializers.CharField()

    class Meta(BasePostSerializer.Meta):
        model = StoryPost
        fields = BasePostSerializer.Meta.fields + ['content']
        post_type = 'Story'



class EventPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    title = serializers.CharField()
    event_date = serializers.DateTimeField()
 
    class Meta(BasePostSerializer.Meta):
        model = EventPost
        fields = BasePostSerializer.Meta.fields + ['title', 'event_date']
        post_type = 'Event'


class AudioPostSerializer(RegisteredPostSerializer, BasePostSerializer):
    audio_file = serializers.FileField()

    class Meta(BasePostSerializer.Meta):
        model = AudioPost
        fields = BasePostSerializer.Meta.fields + ['audio_file']
        post_type = 'Audio'



# Serializer for handling the creation of posts
class PostCreateSerializer(serializers.Serializer):
    post_type = serializers.CharField()
    user = serializers.SlugRelatedField(
        slug_field='username',
        queryset=BaseUser.objects.all()
    )
    visibility = serializers.ChoiceField(choices=BasePost.VISIBILITY_CHOICES, default='Private')
    restriction = serializers.ChoiceField(choices=BasePost.RESTRICTION_CHOICES, default='SFW')
    comments_setting = serializers.ChoiceField(choices=BasePost.COMMENTS_CHOICES, default='Allow')
    media_files = serializers.ListField(
        child=serializers.FileField(),
        required=False
    )
    content = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        post_type = validated_data.pop('post_type')
        user = validated_data.pop('user')

        media_files_data = validated_data.pop('media_files', [])

        serializer_class = self.get_post_type_serializer(post_type)
        if not serializer_class:
            raise serializers.ValidationError(f"Invalid post type: {post_type}")

        post_specific_data = {key: validated_data.pop(key) for key in list(validated_data.keys()) if key not in ['visibility', 'restriction', 'comments_setting', 'content']}
        
        post_specific_serializer = serializer_class(data=post_specific_data)
        post_specific_serializer.is_valid(raise_exception=True)

        post_model = serializer_class.Meta.model

        post_data = {**validated_data, **post_specific_serializer.validated_data, 'user': user}
        post = post_model.objects.create(**post_data)

        # 🛠 FIX: Save uploaded media files if VisualPost
        if isinstance(post, VisualPost) and media_files_data:
            for uploaded_file in media_files_data:
                media_instance = MediaFile.objects.create(file=uploaded_file)
                post.media_files.add(media_instance)  # ✅ This actually connects the files to the VisualPost!

        return post



    @staticmethod
    def get_post_type_serializer(post_type):
        return POST_TYPE_REGISTRY.get(post_type)