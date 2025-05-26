# space/library/views.py
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.parsers import MultiPartParser
from uuid import UUID


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_folder_detail(request, folder_id):
    try:
        folder = LibraryItem.objects.get(id=folder_id, owner=request.user, type="folder")
    except LibraryItem.DoesNotExist:
        return Response({"error": "Folder not found."}, status=404)

    children = LibraryItem.objects.filter(parent=folder, owner=request.user)
    data = {
        "folder": LibraryItemSerializer(folder).data,
        "children": LibraryItemSerializer(children, many=True).data,
    }
    return Response(data)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_library_folder(request):
    title = request.data.get("title")
    parent_id = request.data.get("parent")
    parent = LibraryItem.objects.filter(id=parent_id).first() if parent_id else None

    if not title:
        return Response({"error": "Folder title required."}, status=400)

    item = LibraryItem.objects.create(
        owner=request.user,
        title=title,
        type="folder",
        parent=parent
    )
    return Response(LibraryItemSerializer(item).data)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_library_file(request):
    file = request.FILES.get("file")
    title = file.name
    parent_id = request.data.get("parent")
    parent = LibraryItem.objects.filter(id=parent_id).first() if parent_id else None

    item = LibraryItem.objects.create(
        owner=request.user,
        title=title,
        file=file,
        type="file",
        parent=parent,
    )
    return Response(LibraryItemSerializer(item).data)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def library_items(request):
    parent_param = request.GET.get("parent")
    try:
        parent = UUID(parent_param) if parent_param else None
    except (ValueError, TypeError):
        return Response({"error": "Invalid parent UUID."}, status=400)

    items = LibraryItem.objects.filter(owner=request.user, parent=parent)
    return Response(LibraryItemSerializer(items, many=True).data)
