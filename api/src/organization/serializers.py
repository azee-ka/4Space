from rest_framework import serializers
from .models import Organization, OrganizationMembership


class OrganizationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'name', 'slug', 'description', 'org_type',
            'logo', 'banner', 'email_domain', 'require_domain_email',
            'website', 'location', 'contact_email', 'contact_phone',
            'social_links'
        ]
        extra_kwargs = {
            'slug': {'required': False},
            'social_links': {'required': False},
            'logo': {'required': False},
            'banner': {'required': False},
        }

    def create(self, validated_data):
        user = self.context['request'].user

        # Create the organization
        organization = Organization.objects.create(
            created_by=user,
            **validated_data
        )

        # Create membership as owner (auto-approved)
        OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            role='owner',
            is_approved=True
        )

        # Optional: mark user as org_owner
        user.is_org_owner = True
        user.save(update_fields=["is_org_owner"])

        return organization
