from rest_framework import serializers
from .models import ExchangePost

from ...user.serializers import EssentialUserSerializer


class ExchangePostSerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    community = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ExchangePost
        fields = [
            'id', 'title', 'content', 'created_at', 'updated_at',
            'author', 'upvotes', 'comments_count', 'community'
        ]

    def get_community(self, obj):
        return {
            'slug': obj.community.slug,
        }


class CreateExchangePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangePost
        fields = ['title', 'content']
