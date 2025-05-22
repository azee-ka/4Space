from rest_framework import serializers
from .models import ExchangePost


class ExchangePostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = ExchangePost
        fields = [
            'id', 'title', 'content', 'created_at', 'updated_at',
            'author_username', 'upvotes', 'comments_count'
        ]


class CreateExchangePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangePost
        fields = ['title', 'content']
