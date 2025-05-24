from rest_framework import serializers
from .models import *

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"

class MarkdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkdownContent
        fields = "__all__"

class RichTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = RichTextContent
        fields = "__all__"

class LaTeXSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaTeXContent
        fields = "__all__"

class CodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeContent
        fields = "__all__"

class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotebookContent
        fields = "__all__"
