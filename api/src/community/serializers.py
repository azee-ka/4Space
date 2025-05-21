from rest_framework import serializers
from django.utils.text import slugify
from .models import Community, CommunityTab, TabDefinition, CommunityPermission, CommunityMembership
from ..community.constants import COMMUNITY_TEMPLATES
from .permissions_defaults import DEFAULT_ADMIN_PERMISSIONS

class CommunityTabSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityTab
        fields = ['id', 'custom_label', 'order', 'config', 'is_active', 'tab_definition']




class CommunityDetailSerializer(serializers.ModelSerializer):
    tabs = CommunityTabSerializer(many=True, read_only=True)
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
            'banner', 'logo', 'tabs',
            'permissions', 'members_count', 'online_members_count',
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
                    defaults={
                        'order': i,
                        'custom_label': tab.get('label', ''),
                        'config': tab.get('config', {}),
                        'viewable_by_roles': tab.get('viewable_by_roles', ['member']),
                        'editable_by_roles': tab.get('editable_by_roles', ['admin'])
                    }
                )

                if not created:
                    # Update fields if it already existed
                    community_tab.custom_label = tab.get('label', community_tab.custom_label)
                    community_tab.order = i
                    community_tab.config = tab.get('config', community_tab.config)
                    community_tab.viewable_by_roles = tab.get('viewable_by_roles', ['member'])
                    community_tab.editable_by_roles = tab.get('editable_by_roles', ['admin'])
                    community_tab.save()

        return instance









class CommunityCreateSerializer(serializers.ModelSerializer):
    community_type = serializers.ChoiceField(
        choices=[(k, v['label']) for k, v in COMMUNITY_TEMPLATES.items()],
        required=False
    )
    slug = serializers.CharField(required=False)
    tabs = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Community
        fields = ['name', 'slug', 'description', 'community_type', 'parent', 'tabs']

    def create(self, validated_data):
        type_key = validated_data.pop('community_type', 'general')
        selected_tabs = validated_data.pop('tabs', COMMUNITY_TEMPLATES[type_key]['tabs'])

        if 'slug' not in validated_data or not validated_data['slug']:
            validated_data['slug'] = slugify(validated_data['name'])

        user = self.context['request'].user
        community = Community.objects.create(**validated_data, created_by=user)

        # ✅ Add membership and permissions
        CommunityMembership.objects.create(user=user, community=community, role='admin')
        CommunityPermission.objects.create(user=user, community=community, permissions=DEFAULT_ADMIN_PERMISSIONS)

        for i, tab_key in enumerate(selected_tabs):
            try:
                tab_def = TabDefinition.objects.get(key=tab_key)
                CommunityTab.objects.create(
                    community=community,
                    tab_definition=tab_def,
                    order=i
                )
            except TabDefinition.DoesNotExist:
                continue

        return community
