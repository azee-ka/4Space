from rest_framework import serializers
from .models import BaseUser
from rest_framework import serializers


def build_category_representation(instance, representation, categories):
    data = {}
    
    for category, fields in categories.items():
        if category == 'stats':
            # Dynamically calculate the counts based on which fields are specified
            count_data = {}
            if 'following_count' in fields:
                count_data['following_count'] = instance.following.count()
            if 'followers_count' in fields:
                count_data['followers_count'] = instance.followers.count()
            if 'posts_count' in fields:
                count_data['posts_count'] = instance.authored_posts.count()  # Ensure we use 'authored_entries'
            data[category] = count_data
        else:
            # For other categories, just include the relevant fields
            data[category] = {field: representation[field] for field in fields}
    
    return data



class MentionUserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_image', 'last_name', 'first_name']


class EssentialUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_image']
        
        
class MinimalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['first_name', 'last_name', 'username', 'email', 'profile_image']
        
class BaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'display_name', 'date_of_birth', 'profile_image', 'is_private_profile']



class EntriesCountMixin:
    """
    Mixin that adds the 'entries_count' field to any serializer.
    """
    authored_posts = serializers.SerializerMethodField()

    def get_posts_count(self, obj):
        # Assuming 'authored_posts' is the reverse relationship on BaseUser for the posts they authored
        return obj.authored_posts.count()







class PartialProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = [ 'id', 'username', 'profile_image', 'about_me',
                  'is_private_profile',
                  ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['id', 'username', 'profile_image'],
            'stats': ['following_count', 'followers_count'],
            'privacy': ['is_private_profile'],
        }
        return build_category_representation(instance, representation, categories)


class FullProfileSerializer(EntriesCountMixin, serializers.ModelSerializer):
    followers = MinimalUserSerializer(many=True)
    following = MinimalUserSerializer(many=True)
    class Meta:
        model = BaseUser
        fields =  [ 'id', 'username', 'profile_image', 'date_joined',
                   'is_private_profile', 'followers', 'following',
                   ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['id', 'username', 'profile_image', 'date_joined'],
            'stats': ['following_count', 'followers_count', 'entries_count', 'packets_count', 'flares_count'],
            'privacy': ['is_private_profile'],
            'data' : ['followers', 'following']
        }
        return build_category_representation(instance, representation, categories)


class MyProfileSerializer(EntriesCountMixin, serializers.ModelSerializer):
    followers = MinimalUserSerializer(many=True)
    following = MinimalUserSerializer(many=True)
    class Meta:
        model = BaseUser
        fields = ['first_name', 'last_name', 'username', 'email', 'profile_image', 'date_joined', 
                  'is_private_profile', 'followers', 'following',
                  ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['first_name', 'last_name', 'username', 'email', 'profile_image', 'date_joined'],
            'stats': ['following_count', 'followers_count', 'entries_count', 'packets_count', 'flares_count'],
            'privacy': ['is_private_profile'],
            'data' : ['followers', 'following']
        }
        return build_category_representation(instance, representation, categories)



class EditUserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['first_name', 'last_name', 'username', 'email', 'display_name', 'profile_image', 'about_me', 'gender']





class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)  # Frontend sends 'username'
    org_role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = BaseUser
        fields = ['email', 'password', 'username', 'first_name', 'last_name', 'org_role']

    def create(self, validated_data):
        validated_data.pop('org_role', None)  # Don't store it on BaseUser
        user = BaseUser.objects.create_user(**validated_data)
        return user







class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['display_name', 'about_me', 'username_anon', 'username_pro', 'role', 'profile_image']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance




class UserProfilePictureUpdateSerializer(serializers.Serializer):
    profile_picture = serializers.ImageField()
    
    
    