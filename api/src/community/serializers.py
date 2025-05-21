from rest_framework import serializers
from django.utils.text import slugify
from .models import Community, CommunityTab, CommunityPermission, CommunityMembership
from .permissions_defaults import DEFAULT_ADMIN_PERMISSIONS
from .tab_registry import TAB_REGISTRY_FLAT

class CommunityTabSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = CommunityTab
        fields = ['key', 'order', 'is_active', 'label', 'icon', 'category']

    def get_label(self, obj):
        return TAB_REGISTRY_FLAT.get(obj.key, {}).get("label", obj.key.title())

    def get_icon(self, obj):
        return TAB_REGISTRY_FLAT.get(obj.key, {}).get("icon", "")

    def get_category(self, obj):
        return TAB_REGISTRY_FLAT.get(obj.key, {}).get("category", "")

    

class CommunityDetailSerializer(serializers.ModelSerializer):
    tabs = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField()
    permissions = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    online_members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description', 'category',
            'created_by', 'created_at',
            'is_public', 'restricted_to_org_members',
            'organization', 'type',
            'banner', 'logo',
            'permissions', 'members_count', 'online_members_count',
            'tabs',
        ]

    def get_permissions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {}

        user = request.user

        try:
            perm = CommunityPermission.objects.get(community=obj, user=user)
            return perm.permissions
        except CommunityPermission.DoesNotExist:
            try:
                membership = CommunityMembership.objects.get(community=obj, user=user)
                if membership.role == 'admin':
                    return DEFAULT_ADMIN_PERMISSIONS
            except CommunityMembership.DoesNotExist:
                pass

        return {}

    def get_members_count(self, obj):
        return obj.communitymembership_set.count()
    
    def get_online_members_count(self, obj):
        # need a real implementation for this
        return 0  # placeholder or logic tied to user sessions

    def get_tabs(self, obj):
        tabs = obj.tabs.order_by('order')
        return CommunityTabSerializer(tabs, many=True).data





class CommunityUpdateSerializer(serializers.ModelSerializer):
    tabs = serializers.ListField(child=serializers.DictField(), required=False)

    class Meta:
        model = Community
        fields = [
            'name', 'description', 'slug',
            'is_public', 'allow_custom_tabs', 'restricted_to_org_members',
            'banner', 'logo', 'tabs'
        ]

    def update(self, instance, validated_data):
        from .models import TabDefinition, CommunityTab

        tabs_data = validated_data.pop('tabs', None)
        errors = []

        # Update base fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tabs_data:
            for i, tab in enumerate(tabs_data):
                tab_key = tab.get('key')
                action = tab.get('action', 'add')  # default to 'add'

                if not tab_key:
                    errors.append(f"Missing 'key' in tab entry at index {i}")
                    continue

                try:
                    tab_def = TabDefinition.objects.get(key=tab_key)
                except TabDefinition.DoesNotExist:
                    errors.append(f"Invalid tab key: '{tab_key}'")
                    continue

                if action == 'delete':
                    CommunityTab.objects.filter(community=instance, tab_definition=tab_def).delete()
                    continue

                # Add or update
                community_tab, created = CommunityTab.objects.get_or_create(
                    community=instance,
                    tab_definition=tab_def,
                    defaults={'order': i, 'is_active': True}
                )


                if not created:
                    community_tab.order = i
                    community_tab.is_active = True
                    community_tab.save()


        return instance






class CommunityCreateSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(required=False)
    type = serializers.CharField(required=False, allow_blank=True, default='general')

    class Meta:
        model = Community
        fields = ['name', 'slug', 'description', 'type', 'parent']

    def create(self, validated_data):
        if 'slug' not in validated_data or not validated_data['slug']:
            validated_data['slug'] = slugify(validated_data['name'])

        user = self.context['request'].user
        community = Community.objects.create(**validated_data, created_by=user)

        # Default membership & permissions
        CommunityMembership.objects.create(user=user, community=community, role='admin')
        CommunityPermission.objects.create(user=user, community=community, permissions=DEFAULT_ADMIN_PERMISSIONS)

        return community



    
    
class CommunityTabCreateSerializer(serializers.Serializer):
    key = serializers.CharField()

    def validate_key(self, value):
        from src.community.tab_registry import TAB_REGISTRY_FLAT
        if value not in TAB_REGISTRY_FLAT:
            raise serializers.ValidationError(f"Invalid tab key: '{value}'")
        return value
