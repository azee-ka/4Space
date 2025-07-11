# src/collection/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Collection, CollectionItem, VISIBILITY_CHOICES


class CollectionSerializer(serializers.ModelSerializer):
    contains = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            'id',
            'title',
            'description',
            'visibility',
            'created_at',
            'contains',
        ]

    def get_contains(self, obj):
        request = self.context.get('request')
        ct_param = request.query_params.get('content_type')
        obj_param = request.query_params.get('object_id')
        if not ct_param or not obj_param:
            return False
        try:
            ct = ContentType.objects.get(model=ct_param.lower())
        except ContentType.DoesNotExist:
            return False
        return CollectionItem.objects.filter(
            collection=obj,
            content_type=ct,
            object_id=obj_param
        ).exists()


class CollectionItemSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField()
    content = serializers.SerializerMethodField()
    visibility = serializers.ChoiceField(choices=VISIBILITY_CHOICES)

    class Meta:
        model = CollectionItem
        fields = ['id', 'added_at', 'content_type', 'object_id', 'visibility', 'content']

    def get_content(self, obj):
        from src.post.serializers import PostRetrieveSerializer
        from src.community.general.serializers import ExchangePostSerializer, ExchangeReplySerializer
        from src.post.serializers import CommentSerializer
        request = self.context.get('request')
        ct_model = obj.content_type.model_class()
        if ct_model.__name__ == 'ThreadPost':
            return PostRetrieveSerializer(obj.content_object, context={'request': request}).data
        elif ct_model.__name__ == 'VisualPost':
            from src.post.serializers import MinimalVisualPostSerializer
            return MinimalVisualPostSerializer(obj.content_object, context={'request': request}).data
        elif ct_model.__name__ == 'ExchangePost':
            return ExchangePostSerializer(obj.content_object, context={'request': request}).data
        elif ct_model.__name__ == 'ExchangeReply':
            return ExchangeReplySerializer(obj.content_object, context={'request': request}).data
        elif ct_model.__name__ == 'Comment':
            return CommentSerializer(obj.content_object, context={'request': request}).data
        return None


class AddItemToCollectionSerializer(serializers.Serializer):
    collection_id = serializers.UUIDField()
    content_type = serializers.CharField()
    object_id = serializers.UUIDField()
    visibility = serializers.ChoiceField(choices=VISIBILITY_CHOICES, default='private')

    def validate(self, data):
        try:
            data['content_type_obj'] = ContentType.objects.get(model=data['content_type'].lower())
        except ContentType.DoesNotExist:
            raise serializers.ValidationError('Invalid content type.')
        return data

    def create(self, validated_data):
        collection = Collection.objects.get(id=validated_data['collection_id'])
        return CollectionItem.objects.create(
            collection=collection,
            added_by=self.context['request'].user,
            content_type=validated_data['content_type_obj'],
            object_id=validated_data['object_id'],
            visibility=validated_data['visibility']
        )
