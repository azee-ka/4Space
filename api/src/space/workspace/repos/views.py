# space/repos/views.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
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
def upload_repository_structure(request, repo_id):
    """
    Accepts multipart/form-data with multiple files under key 'files'.
    Each File.name should be the webkitRelativePath (e.g. 'src/components/Button.js').
    """
    repo = get_object_or_404(Repository, id=repo_id)

    files = request.FILES.getlist("files")
    paths = request.data.getlist("paths")

    if not files:
        return Response({"detail": "No files provided."}, status=400)
    if len(files) != len(paths):
        return Response({"detail": "Malformed upload (paths/files length mismatch)"},
                        status=400)

    created = []
    for uploaded, rel_path in zip(files, paths):
        filename = rel_path.split("/")[-1]
        # … same as before …
        lib = LibraryItem.objects.create(
            title=filename,
            type="file",
            file=uploaded,
            owner=request.user,
        )
        link = RepositoryLibraryItem.objects.create(
            repository=repo,
            item=lib,
            alias=filename,
            path=rel_path,      # now uses the explicit path you passed
        )
        created.append(link)


    serializer = RepositoryLibraryItemSerializer(created, many=True)
    return Response(
        {"uploaded": len(created), "items": serializer.data},
        status=status.HTTP_201_CREATED
    )





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
        data["files"] = RepositoryLibraryItemSerializer(repo.linked_items.all(), many=True, context={"request": request}).data        
        data["tasks"] = RepositoryTaskSerializer(repo.tasks.all(), many=True).data
        data["notes"] = RepositoryNoteSerializer(repo.notes.all(), many=True).data
        return Response(data)
    except Repository.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

