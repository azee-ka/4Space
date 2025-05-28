# space/repos/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import *
from .serializers import *

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def repositories_view(request):
    if request.method == "POST":
        data = request.data.copy()
        data["owner"] = request.user.id
        serializer = RepositorySerializer(data=data)
        if serializer.is_valid():
            repo = serializer.save()
            return Response(RepositorySerializer(repo).data)
        return Response(serializer.errors, status=400)
    else:
        repos = Repository.objects.filter(owner=request.user)
        return Response(RepositorySerializer(repos, many=True).data)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_project_to_repo(request, repo_id):
    data = request.data.copy()
    data["repository"] = repo_id
    serializer = RepositoryProjectSerializer(data=data)
    if serializer.is_valid():
        link = serializer.save()
        return Response(RepositoryProjectSerializer(link).data)
    return Response(serializer.errors, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_item_to_repo(request, repo_id):
    data = request.data.copy()
    data["repository"] = repo_id
    serializer = RepositoryLibraryItemSerializer(data=data)
    if serializer.is_valid():
        link = serializer.save()
        return Response(RepositoryLibraryItemSerializer(link).data)
    return Response(serializer.errors, status=400)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def repository_detail(request, repo_id):
    try:
        repo = Repository.objects.get(id=repo_id)
        data = RepositorySerializer(repo).data
        data["projects"] = RepositoryProjectSerializer(repo.linked_projects.all(), many=True).data
        data["files"] = RepositoryLibraryItemSerializer(repo.linked_items.all(), many=True).data
        data["tasks"] = RepositoryTaskSerializer(repo.tasks.all(), many=True).data
        data["notes"] = RepositoryNoteSerializer(repo.notes.all(), many=True).data
        return Response(data)
    except Repository.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

