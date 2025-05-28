# space/repos/serializers.py
from rest_framework import serializers
from .models import *

class RepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Repository
        fields = "__all__"

class RepositoryProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryProject
        fields = "__all__"

class RepositoryLibraryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryLibraryItem
        fields = "__all__"

class RepositoryTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryTask
        fields = "__all__"

class RepositoryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryNote
        fields = "__all__"
