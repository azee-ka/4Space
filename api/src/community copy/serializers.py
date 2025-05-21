from rest_framework import serializers
from .models import Community, CommunityTab, CommunityTemplate


class CommunityMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = [
            'id',
            'name',
            'slug',
            'logo',
            'description',
            'visibility',
            'theme_color'
        ]
        

class CommunityDetailSerializer(serializers.ModelSerializer):
    tabs = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'visibility',
            'theme_color',
            'logo',
            'banner_image',
            'is_verified',
            'created_at',
            'creator',
            'template',
            'custom_fields_data',
            'tabs',
        ]

    def get_tabs(self, obj):
        return [
            {
                'id': tab.id,
                'name': tab.name,
                'tab_type': tab.tab_type,
                'ordering': tab.ordering,
            }
            for tab in obj.tabs.filter(is_active=True).order_by('ordering')
        ]
        
        
        
class CommunityCreateSerializer(serializers.ModelSerializer):
    selected_tabs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of extra tabs the user wants to add (Discussion Board is default)."
    )

    class Meta:
        model = Community
        fields = [
            'name',
            'description',
            'visibility',
            'logo',
            'banner_image',
            'theme_color',
            'template',
            'selected_tabs',
        ]
        extra_kwargs = {
            'description': {'required': False},
            'visibility': {'default': 'public'},
            'template': {'required': False},
        }

    def create(self, validated_data):
        selected_tabs = validated_data.pop('selected_tabs', [])

        # Set default template if not specified
        template = validated_data.get('template')
        if template is None:
            try:
                validated_data['template'] = CommunityTemplate.objects.get(name__iexact="General")
            except CommunityTemplate.DoesNotExist:
                validated_data['template'] = None  # fallback
        
        community = Community.objects.create(**validated_data)

        # Always create a Discussion tab
        CommunityTab.objects.create(
            community=community,
            name="Discussions",
            tab_type="discussion",
            ordering=0
        )

        # Create any additional selected tabs
        for idx, tab_name in enumerate(selected_tabs, start=1):
            CommunityTab.objects.create(
                community=community,
                name=tab_name,
                tab_type=self.infer_tab_type(tab_name),
                ordering=idx
            )

        return community

    def infer_tab_type(self, tab_name):
        """Infer tab type from the name (basic mapping)"""
        mapping = {
            "Projects": "projects",
            "Events": "events",
            "Resources": "library",
            "Funding": "funding",
            "Tasks": "tasks",
            "Notebook": "notebook",
            "Assignments": "assignments",
            "Grades": "grades",
            "Whitepapers": "whitepaper",
        }
        return mapping.get(tab_name, 'custom')
