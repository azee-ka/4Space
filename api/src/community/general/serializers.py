from rest_framework import serializers
from .models import DiscussionPost


class DiscussionPostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = DiscussionPost
        fields = [
            'id', 'title', 'content', 'created_at', 'updated_at',
            'author_username', 'upvotes', 'comments_count'
        ]


class CreateDiscussionPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscussionPost
        fields = ['title', 'content']
