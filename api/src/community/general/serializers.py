# src/apps/communities/community/serializers.py

from rest_framework import serializers
from .models import ExchangePost, ExchangeReply
from ...user.serializers import EssentialUserSerializer

class ExchangeReplySerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    replies_count = serializers.IntegerField(source='replies.count', read_only=True)

    class Meta:
        model = ExchangeReply
        fields = ['id', 'content', 'created_at', 'upvotes', 'author', 'replies_count']


class ReplySerializer(ExchangeReplySerializer):
    class Meta(ExchangeReplySerializer.Meta):
        pass  # same fields, can be customized if needed


class CreateExchangeReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeReply
        fields = ['content', 'parent']


class ExchangePostSerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    community = serializers.SerializerMethodField()
    replies_count = serializers.IntegerField(source='comments.count', read_only=True)  # total top-level count

    class Meta:
        model = ExchangePost
        fields = [
            'id',
            'title',
            'content',
            'created_at',
            'author',
            'upvotes',
            'comments_count',   # the denormalized count
            'replies_count',    # live count of top-level ExchangeReply objects
            'community'
        ]

    def get_community(self, obj):
        return {'slug': obj.community.slug}


class CreateExchangePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangePost
        fields = ['title', 'content']
