# space/ide/serializers.py
from rest_framework import serializers
from .models import CodeFile

class CodeFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeFile
        fields = "__all__"
