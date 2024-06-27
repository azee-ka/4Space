# api/user/baseUser/serializers.py
from rest_framework import serializers
from .models import BaseUser

class UserProfilePictureUpdateSerializer(serializers.Serializer):
    profile_picture = serializers.ImageField()
    
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['first_name', 'last_name', 'email']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_picture', 'first_name', 'last_name', 'date_joined']


class IdealUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_picture', 'first_name', 'last_name']


class PartialUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'profile_picture']


class BaseUserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile_picture']

class BaseUserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = BaseUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile_picture']
