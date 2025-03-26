from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Collection, CollectionItem
from ...axionspace.models import Entry
from ...radianspace.models import Flare
from ...quantaspace.models import Packet

from ...axionspace.serializers import EntrySerializer
from ...radianspace.serializers import FlareSerializer
from ...quantaspace.serializers import PacketSerializer

class CollectionItemSerializer(serializers.ModelSerializer):
    object_data = serializers.SerializerMethodField()

    class Meta:
        model = CollectionItem
        fields = ['id', 'object_data']

    def get_object_data(self, obj):
        content_type = obj.content_type.model_class()
        related_object = content_type.objects.get(id=obj.object_id)
        
        # Return the appropriate serializer data based on the type of object
        if isinstance(related_object, Flare):
            return FlareSerializer(related_object).data
        elif isinstance(related_object, Packet):
            return PacketSerializer(related_object).data
        elif isinstance(related_object, Entry):
            return EntrySerializer(related_object).data
        return {}

class CollectionSerializer(serializers.ModelSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ['id', 'name', 'is_default', 'items']