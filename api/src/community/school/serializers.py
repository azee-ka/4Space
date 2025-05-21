from rest_framework import serializers
from .models import CommunityGrade, CommunityAssignment

class CommunityGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityGrade
        fields = "__all__"

class CommunityAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityAssignment
        fields = "__all__"
