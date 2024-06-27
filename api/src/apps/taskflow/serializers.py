from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

    def create(self, validated_data):
        user = self.context['request'].user.interactuser.taskflow_user
        validated_data['user'] = user
        return super().create(validated_data)


class CreateTaskSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed', 'started', 'created_at', 'user']

    def create(self, validated_data):
        user = self.context['request'].user.interactuser.taskflow_user
        validated_data['user'] = user
        return super().create(validated_data)
