from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import *
from .serializers import *
from uuid import UUID

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def projects_view(request):
    if request.method == "POST":
        data = request.data.copy()
        data["owner"] = request.user.id  # Set owner directly
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            project = serializer.save()
            return Response(ProjectSerializer(project).data)
        return Response(serializer.errors, status=400)
    else:
        projects = Project.objects.filter(owner=request.user)
        return Response(ProjectSerializer(projects, many=True).data)



@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def tool_content_view(request, project_id, tool):
    try:
        project = Project.objects.get(id=UUID(project_id), owner=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Project not found or unauthorized."}, status=404)

    model_map = {
        "markdown": (MarkdownContent, MarkdownSerializer),
        "richtext": (RichTextContent, RichTextSerializer),
        "latex": (LaTeXContent, LaTeXSerializer),
        "code": (CodeContent, CodeSerializer),
        "notebook": (NotebookContent, NotebookSerializer),
    }

    if tool not in model_map:
        return Response({"detail": "Invalid tool."}, status=400)

    model, serializer_class = model_map[tool]
    content, _ = model.objects.get_or_create(project=project)

    if request.method == "PUT":
        serializer = serializer_class(content, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    return Response(serializer_class(content).data)
