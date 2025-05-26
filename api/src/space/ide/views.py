# space/ide/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Project
from .models import CodeFile
from .serializers import CodeFileSerializer

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def code_files_view(request, project_id):
    try:
        project = Project.objects.get(id=project_id, owner=request.user)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)

    if request.method == "GET":
        files = CodeFile.objects.filter(project=project)
        return Response(CodeFileSerializer(files, many=True).data)

    if request.method == "POST":
        data = request.data.copy()
        data["project"] = str(project.id)
        serializer = CodeFileSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def code_file_detail_view(request, project_id, file_id):
    try:
        file = CodeFile.objects.get(id=file_id, project__id=project_id, project__owner=request.user)
    except CodeFile.DoesNotExist:
        return Response({"error": "File not found"}, status=404)

    if request.method == "GET":
        return Response(CodeFileSerializer(file).data)

    if request.method == "PUT":
        serializer = CodeFileSerializer(file, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        file.delete()
        return Response({"status": "deleted"})
