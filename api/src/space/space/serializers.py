from rest_framework import serializers
from .models import Workflow, AgentTask, Project, ProjectFile

class AgentTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentTask
        fields = '__all__'

class WorkflowSerializer(serializers.ModelSerializer):
    tasks = AgentTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = ['id', 'prompt', 'created_at', 'tasks']




class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    files = ProjectFileSerializer(many=True, read_only=True)
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'files']
