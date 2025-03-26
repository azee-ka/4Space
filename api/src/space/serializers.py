from rest_framework import serializers
from .models import Space, SpaceMembership, Widget

class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['uuid', 'name', 'description', 'owner', 'privacy', 'category', 'theme', 'created_at', 'updated_at']
        
    
class ListSpacesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['uuid', 'name', 'description']
        

class SpaceMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceMembership
        fields = '__all__'

class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = '__all__'




class EditSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['name', 'description', 'privacy', 'category']
    
    def create(self, validated_data):
        # Automatically assign the current user as the author
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    

class CreateSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['name', 'description', 'privacy', 'category']
    
    def create(self, validated_data):
        # Automatically assign the current user as the author
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)