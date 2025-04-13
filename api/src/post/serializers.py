from rest_framework import serializers
from .models import ThreadPost, VisualPost, PollPost, StoryPost, EventPost, AudioPost
from ..user.models import BaseUser

class BasePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreadPost  # This will be the base class for all post types
        fields = ['id', 'user', 'visibility', 'restriction', 'comments_setting', 'created_at', 'updated_at']


class ThreadPostSerializer(serializers.ModelSerializer):
    content = serializers.CharField()

    class Meta:
        model = ThreadPost
        fields = ['content']


class VisualPostSerializer(serializers.ModelSerializer):
    content = serializers.CharField()

    class Meta:
        model = VisualPost
        fields = ['content', 'media_files']


class PollPostSerializer(serializers.ModelSerializer):
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    expiration_date = serializers.DateTimeField()

    class Meta:
        model = PollPost
        fields = ['question', 'options', 'expiration_date']


class StoryPostSerializer(serializers.ModelSerializer):
    content = serializers.CharField()

    class Meta:
        model = StoryPost
        fields = ['content']


class EventPostSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    event_date = serializers.DateTimeField()

    class Meta:
        model = EventPost
        fields = ['title', 'event_date']


class AudioPostSerializer(serializers.ModelSerializer):
    audio_file = serializers.FileField()

    class Meta:
        model = AudioPost
        fields = ['audio_file']


# Serializer for handling the creation of posts
class PostCreateSerializer(serializers.Serializer):
    post_type = serializers.CharField()
    user = serializers.CharField()  # Accept username instead of UUID
    visibility = serializers.ChoiceField(choices=ThreadPost.VISIBILITY_CHOICES, default='Private')
    restriction = serializers.ChoiceField(choices=ThreadPost.RESTRICTION_CHOICES, default='SFW')
    comments_setting = serializers.ChoiceField(choices=ThreadPost.COMMENTS_CHOICES, default='Allow')
    media_files = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_user(self, value):
        """
        Validate and resolve the username to a BaseUser object.
        """
        try:
            user = BaseUser.objects.get(username=value)
        except BaseUser.DoesNotExist:
            raise serializers.ValidationError("User with this username does not exist.")
        return user

    # Dynamically validate and create post-specific fields
    def validate(self, data):
        post_type = data.get('post_type')
        if not post_type:
            raise serializers.ValidationError("Post type is required.")

        # Dynamically select the appropriate serializer
        serializer_class = self.get_post_type_serializer(post_type)
        if not serializer_class:
            raise serializers.ValidationError(f"Invalid post type: {post_type}")

        # Validate post-specific fields using the selected serializer
        post_specific_serializer = serializer_class(data=self.context['request'].data)
        post_specific_serializer.is_valid(raise_exception=True)
        data['post_specific_data'] = post_specific_serializer.validated_data
        return data

    def create(self, validated_data):
        post_type = validated_data.pop('post_type')
        user = validated_data.pop('user')  # This is now a BaseUser object
        post_specific_data = validated_data.pop('post_specific_data')

        # Dynamically create the appropriate post type
        serializer_class = self.get_post_type_serializer(post_type)
        if not serializer_class:
            raise serializers.ValidationError(f"Invalid post type: {post_type}")

        # Merge common and post-specific data
        post_data = {**validated_data, **post_specific_data, 'user': user}
        return serializer_class.Meta.model.objects.create(**post_data)

    @staticmethod
    def get_post_type_serializer(post_type):
        """
        Map post types to their specific serializers.
        """
        post_type_serializers = {
            'Thread': ThreadPostSerializer,
            'Visual': VisualPostSerializer,
            'Poll': PollPostSerializer,
            'Story': StoryPostSerializer,
            'Event': EventPostSerializer,
            'Audio': AudioPostSerializer,
        }
        return post_type_serializers.get(post_type)
