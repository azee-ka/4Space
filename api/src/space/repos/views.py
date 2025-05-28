# space/repos/views.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.parsers import MultiPartParser
from rest_framework import status

from .models import Repository, RepositoryLibraryItem
from ..library.models import LibraryItem
from .serializers import RepositoryLibraryItemSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_files_to_repository(request, repo_id):
    try:
        repo = Repository.objects.get(id=repo_id)
    except Repository.DoesNotExist:
        return Response({"error": "Repository not found."}, status=404)

    files = request.FILES.getlist("files")
    if not files:
        return Response({"error": "No files provided."}, status=400)

    uploaded_items = []

    for file in files:
        # Step 1: Create a LibraryItem
        item = LibraryItem.objects.create(
            title=file.name,
            type="file",
            file=file,
            owner=request.user,
        )

        # Step 2: Link to the repository
        link = RepositoryLibraryItem.objects.create(
            repository=repo,
            item=item,
            alias=file.name,
        )

        uploaded_items.append(RepositoryLibraryItemSerializer(link).data)

    return Response({
        "uploaded": len(uploaded_items),
        "items": uploaded_items
    }, status=201)



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

