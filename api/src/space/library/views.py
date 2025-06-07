# space/library/views.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.http import FileResponse, Http404
from uuid import UUID
from .models import LibraryItem
from .serializers import LibraryItemSerializer

def get_parent(parent_id, user):
    if not parent_id:
        return None
    try:
        return LibraryItem.objects.get(id=parent_id, owner=user, type="folder")
    except LibraryItem.DoesNotExist:
        return None

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_items(request):
    parent = request.GET.get("parent")
    try:
        parent_uuid = UUID(parent) if parent else None
    except:
        return Response({"error": "Invalid parent UUID"}, status=400)

    items = LibraryItem.objects.filter(owner=request.user, parent=parent_uuid)
    return Response(LibraryItemSerializer(items, many=True).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_file(request):
    f = request.FILES.get("file")
    if not f:
        return Response({"error": "No file supplied"}, status=400)

    parent = get_parent(request.data.get("parent"), request.user)
    item = LibraryItem.objects.create(
        owner=request.user, title=f.name, file=f, type="file", parent=parent
    )
    return Response(LibraryItemSerializer(item).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_folder(request):
    title = request.data.get("title")
    if not title:
        return Response({"error": "Title required"}, status=400)

    parent = get_parent(request.data.get("parent"), request.user)
    item = LibraryItem.objects.create(
        owner=request.user, title=title, type="folder", parent=parent
    )
    return Response(LibraryItemSerializer(item).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    return Response(LibraryItemSerializer(item).data)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    # rename or move
    title = request.data.get("title")
    parent_id = request.data.get("parent")
    if title:
        item.title = title
    if parent_id is not None:
        item.parent = get_parent(parent_id, request.user)
    item.save()
    return Response(LibraryItemSerializer(item).data)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user)
        item.delete()
        return Response(status=204)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def copy_item(request, item_id):
    try:
        orig = LibraryItem.objects.get(id=item_id, owner=request.user)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    parent = get_parent(request.data.get("parent"), request.user)
    copy = LibraryItem.objects.create(
        owner=request.user,
        title=f"{orig.title} (copy)",
        type=orig.type,
        file=orig.file,
        project=orig.project,
        parent=parent,
    )
    return Response(LibraryItemSerializer(copy).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user, type="file")
        return FileResponse(item.file.open("rb"), as_attachment=True, filename=item.title)
    except LibraryItem.DoesNotExist:
        raise Http404

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def share_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    item.is_shared = True
    token = item.generate_share_token()
    return Response({"shareable_url": item.shareable_url})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unshare_item(request, item_id):
    try:
        item = LibraryItem.objects.get(id=item_id, owner=request.user)
    except LibraryItem.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    item.is_shared = False
    item.share_token = None
    item.save()
    return Response(status=204)
