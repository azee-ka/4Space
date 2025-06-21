# src/user/serializers.py

from rest_framework import serializers
from .models import BaseUser, AuthUser
from datetime import date, datetime


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    professional_tab_order = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    experience = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    education = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    skills = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    certifications = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    projects = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    languages = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    publications = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    references = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )

    class Meta:
        model = BaseUser
        fields = [
            'experience', 'education', 'skills', 'certifications',
            'projects', 'languages', 'publications', 'references',
            'professional_tab_order',
        ]

    def validate(self, data):
        # First run your existing list‐type checks
        list_fields = [
            'experience','education','skills','certifications',
            'projects','languages','publications','references'
        ]
        for field in list_fields:
            if field in data and not isinstance(data[field], list):
                raise serializers.ValidationError({field: "Must be a list."})
            if field != 'skills' and field in data:
                if not all(isinstance(item, dict) for item in data[field]):
                    raise serializers.ValidationError({field: "All items must be dictionaries."})

        # Normalize any empty‐string or missing dates → None
        for list_name in ('experience', 'education'):
            for entry in data.get(list_name, []):
                if entry.get('startDate') in ("", None):
                    entry['startDate'] = None
                if entry.get('endDate') in ("", None):
                    entry['endDate'] = None

        return data

    def _compute_duration(self, start_iso, end_iso):
        if not start_iso:
            return ""
        start = datetime.fromisoformat(start_iso).date()
        end   = datetime.fromisoformat(end_iso).date() if end_iso else date.today()
        months = (end.year - start.year) * 12 + (end.month - start.month)
        if months < 0:
            return ""
        yrs, mos = divmod(months, 12)
        parts = []
        if yrs:
            parts.append(f"{yrs} yr{'s' if yrs>1 else ''}")
        if mos:
            parts.append(f"{mos} mo{'s' if mos>1 else ''}")
        return " ".join(parts)

    def _annotate(self, items):
        out = []
        for entry in items or []:
            e = entry.copy()
            # Guarantee both date keys exist (None → JSON null)
            e.setdefault('startDate', None)
            e.setdefault('endDate',   None)
            # Compute duration up to today if endDate is None
            e['duration'] = self._compute_duration(
                e['startDate'], e['endDate']
            )
            out.append(e)
        return out

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Re-inject computed durations (and explicit nulls) for both sections
        data['experience'] = self._annotate(data.get('experience', []))
        data['education']  = self._annotate(data.get('education', []))
        return data
    
    
    
    


class HandleSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()

    class Meta:
        model  = BaseUser
        fields = ['id', 'username', 'label', 'is_active']

    def get_is_active(self, obj):
        # After middleware, request.user is the *active* BaseUser handle.
        request_user = self.context.get('request').user
        # Compare IDs to see which handle is currently active
        return obj.id == getattr(request_user, 'id', None)


def build_category_representation(instance, representation, categories):
    data = {}
    for category, fields in categories.items():
        if category == 'stats':
            count_data = {}
            if 'following_count' in fields:
                count_data['following_count'] = instance.following.count()
            if 'followers_count' in fields:
                count_data['followers_count'] = instance.followers.count()
            if 'posts_count' in fields:
                count_data['posts_count'] = instance.authored_posts.count()
            data[category] = count_data
        else:
            data[category] = {field: representation[field] for field in fields}
    return data


class UsernameHandleSerializer(serializers.Serializer):
    label     = serializers.CharField(max_length=50)
    handle    = serializers.CharField(max_length=150)
    is_active = serializers.BooleanField()


class MentionUserSearchSerializer(serializers.ModelSerializer):
    # name fields now come from AuthUser
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)

    class Meta:
        model  = BaseUser
        fields = ['id', 'username', 'profile_image', 'first_name', 'last_name']


class EssentialUserSerializer(serializers.ModelSerializer):
    # if you ever need names or email here, add them with source='account.xxx'
    class Meta:
        model  = BaseUser
        fields = ['id', 'username', 'profile_image']


class MinimalUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)
    email      = serializers.EmailField(source='account.email',    read_only=True)

    class Meta:
        model  = BaseUser
        fields = ['first_name', 'last_name', 'username', 'email', 'profile_image']


class BaseUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)
    email      = serializers.EmailField(source='account.email',    read_only=True)

    class Meta:
        model  = BaseUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'display_name', 'date_of_birth', 'profile_image', 'is_private_profile'
        ]


class EntriesCountMixin:
    """
    Mixin that adds the 'entries_count' field to any serializer.
    """
    authored_posts = serializers.SerializerMethodField()

    def get_posts_count(self, obj):
        return obj.authored_posts.count()


class PartialProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)
    email      = serializers.EmailField(source='account.email',    read_only=True)

    class Meta:
        model  = BaseUser
        fields = [
            'id', 'username', 'profile_image', 'about_me',
            'is_private_profile', 'first_name', 'last_name', 'email'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['id','username','profile_image','first_name','last_name','email'],
            'stats':     ['following_count','followers_count'],
            'privacy':   ['is_private_profile'],
        }
        return build_category_representation(instance, representation, categories)


class FullProfileSerializer(EntriesCountMixin, serializers.ModelSerializer):
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)
    email      = serializers.EmailField(source='account.email',    read_only=True)
    followers  = MinimalUserSerializer(many=True)
    following  = MinimalUserSerializer(many=True)

    class Meta:
        model  = BaseUser
        fields = [
            'id', 'username', 'profile_image', 'date_joined',
            'is_private_profile', 'followers', 'following',
            'first_name','last_name','email',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['id','username','profile_image','date_joined','first_name','last_name','email'],
            'stats':     ['following_count','followers_count','entries_count','packets_count','flares_count'],
            'privacy':   ['is_private_profile'],
            'data':      ['followers','following'],
        }
        return build_category_representation(instance, representation, categories)


class MyProfileSerializer(EntriesCountMixin, serializers.ModelSerializer):
    first_name = serializers.CharField(source='account.first_name', read_only=True)
    last_name  = serializers.CharField(source='account.last_name',  read_only=True)
    email      = serializers.EmailField(source='account.email',    read_only=True)
    followers  = MinimalUserSerializer(many=True)
    following  = MinimalUserSerializer(many=True)

    class Meta:
        model  = BaseUser
        fields = [
            'first_name','last_name','username','email','profile_image','date_joined',
            'is_private_profile','followers','following',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        categories = {
            'basicInfo': ['first_name','last_name','username','email','profile_image','date_joined'],
            'stats':     ['following_count','followers_count','entries_count','packets_count','flares_count'],
            'privacy':   ['is_private_profile'],
            'data':      ['followers','following'],
        }
        return build_category_representation(instance, representation, categories)


class EditUserInfoSerializer(serializers.ModelSerializer):
    # delegate name/email edits to the AuthUser
    first_name = serializers.CharField(source='account.first_name', required=False)
    last_name  = serializers.CharField(source='account.last_name',  required=False)
    email      = serializers.EmailField(source='account.email',    required=False)

    class Meta:
        model  = BaseUser
        fields = [
            'first_name', 'last_name', 'username', 'email',
            'display_name', 'profile_image', 'about_me', 'gender'
        ]

    def update(self, instance, validated_data):
        # 1) update AuthUser fields
        acct_data = validated_data.pop('account', {})
        if acct_data:
            for attr, val in acct_data.items():
                setattr(instance.account, attr, val)
            instance.account.save(update_fields=acct_data.keys())

        # 2) update BaseUser handle fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance





class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)
    org_role = serializers.CharField(write_only=True, required=False)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = AuthUser
        fields = [
            'email', 'password', 'username',
            'first_name', 'last_name', 'org_role', 'date_of_birth'
        ]

    def create(self, validated_data):
        validated_data.pop('org_role', None)
        return AuthUser.objects.create_user(**validated_data)








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
    
    
    