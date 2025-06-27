# src/apps/communities/community/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from .models import ExchangePost, ExchangeReply
from ...user.serializers import EssentialUserSerializer
from src.post.models import Vote        # ← adjust this import


#
# ─── REPLY SERIALIZER ─────────────────────────────────────────────────────────────
#
class ExchangeReplySerializer(serializers.ModelSerializer):
    author  = EssentialUserSerializer(read_only=True)
    meta    = serializers.SerializerMethodField()
    stats   = serializers.SerializerMethodField()
    status  = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model  = ExchangeReply
        fields = [
            'id', 'content', 'author',
            'meta', 'stats', 'status',
            'replies',
        ]

    def get_meta(self, obj):
        return {
            'created_at': obj.created_at,
        }

    def get_stats(self, obj):
        ct   = ContentType.objects.get_for_model(obj)
        up   = Vote.objects.filter(content_type=ct, object_id=obj.id, vote_type='upvote').count()
        down = Vote.objects.filter(content_type=ct, object_id=obj.id, vote_type='downvote').count()
        return {
            'upvotes_count':   up,
            'downvotes_count': down,
            'net_votes_count': up - down,
            'replies_count':   obj.replies.count(),
        }

    def get_status(self, obj):
        req  = self.context.get('request', None)
        user = getattr(req, 'user', None)
        if not user or not user.is_authenticated:
            return {'vote_status': 'none'}
        ct = ContentType.objects.get_for_model(obj)
        v  = Vote.objects.filter(user=user, content_type=ct, object_id=obj.id).first()
        return {'vote_status': f"{v.vote_type}d"} if v else {'vote_status': 'none'}

    def get_replies(self, obj):
        qs = obj.replies.all()
        return ExchangeReplySerializer(qs, many=True, context=self.context).data


class CreateExchangeReplySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExchangeReply
        fields = ['content', 'parent']


#
# ─── POST SERIALIZER ──────────────────────────────────────────────────────────────
#
class ExchangePostSerializer(serializers.ModelSerializer):
    author    = EssentialUserSerializer(read_only=True)
    community = serializers.SerializerMethodField()
    meta      = serializers.SerializerMethodField()
    stats     = serializers.SerializerMethodField()
    status    = serializers.SerializerMethodField()

    class Meta:
        model  = ExchangePost
        fields = [
            'id', 'title', 'content', 'author', 'community',
            'meta', 'stats', 'status',
        ]

    def get_community(self, obj):
        return {
            'slug': obj.community.slug,
            'name': obj.community.name,
        }

    def get_meta(self, obj):
        return {
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
        }

    def get_stats(self, obj):
        ct   = ContentType.objects.get_for_model(obj)
        up   = Vote.objects.filter(content_type=ct, object_id=obj.id, vote_type='upvote').count()
        down = Vote.objects.filter(content_type=ct, object_id=obj.id, vote_type='downvote').count()
        return {
            'upvotes_count':   up,
            'downvotes_count': down,
            'net_votes_count': up - down,
            'comments_count':  obj.comments.filter(parent__isnull=True).count(),
        }

    def get_status(self, obj):
        req  = self.context.get('request', None)
        user = getattr(req, 'user', None)
        if not user or not user.is_authenticated:
            return {'vote_status': 'none'}
        ct = ContentType.objects.get_for_model(obj)
        v  = Vote.objects.filter(user=user, content_type=ct, object_id=obj.id).first()
        return {'vote_status': f"{v.vote_type}d"} if v else {'vote_status': 'none'}


class CreateExchangePostSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExchangePost
        fields = ['title', 'content']
