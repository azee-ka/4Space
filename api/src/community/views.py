# communities/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Community, CommunityMembership, CommunityPermission, CommunityTab
from .serializers import CommunityCreateSerializer, CommunityDetailSerializer, CommunityUpdateSerializer, CommunityTabSerializer, CommunityTabCreateSerializer
from ..user.models import BaseUser


DEFAULT_ADMIN_PERMISSIONS = {
    "can_add_tabs": True,
    "can_edit_tabs": True,
    "can_delete_posts": True,
    "can_moderate_comments": True,
    "can_invite_members": True,
}



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tabs_to_community(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found"}, status=404)

    user = request.user
    if not CommunityMembership.objects.filter(user=user, community=community, role__in=["admin", "moderator"]).exists():
        return Response({"detail": "Not authorized"}, status=403)

    tabs_data = request.data.get("tabs", [])
    if not isinstance(tabs_data, list):
        return Response({"detail": "tabs must be a list"}, status=400)

    existing_count = community.tabs.count()

    created_tabs = []
    for i, tab_entry in enumerate(tabs_data):
        serializer = CommunityTabCreateSerializer(data=tab_entry)
        serializer.is_valid(raise_exception=True)

        key = serializer.validated_data["key"]

        tab, _ = CommunityTab.objects.get_or_create(
            community=community,
            key=key,
            defaults={"order": existing_count + i, "is_active": True}
        )
        created_tabs.append(tab)


    serialized = CommunityTabSerializer(created_tabs, many=True)
    return Response({"success": True, "tabs": serialized.data})




@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_community(request, community_id):
    user = request.user
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=404)

    # Check if user is admin of this community
    if not CommunityMembership.objects.filter(user=user, community=community, role__in=['admin', 'moderator']).exists():
        return Response({"detail": "You do not have permission to update this community."}, status=403)

    serializer = CommunityUpdateSerializer(community, data=request.data, context={'request': request}, partial=True)
    if serializer.is_valid():
        updated_community = serializer.save()
        detail_serializer = CommunityDetailSerializer(updated_community, context={'request': request})
        return Response(detail_serializer.data)
    #     return Response({"success": True, "community_id": updated_community.id})
    return Response(serializer.errors, status=400)



@api_view(['GET'])
@permission_classes([AllowAny])  # or IsAuthenticated if you want to restrict
def get_community_by_id(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = CommunityDetailSerializer(community, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_community(request):
    serializer = CommunityCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        community = serializer.save()
        CommunityTab.objects.create(
            community=community,
            key="home",
            order=0,
            is_active=True
        )
        return Response({"success": True, "community_id": community.id})
    return Response(serializer.errors, status=400)













@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_permissions(request, community_id, user_id):
    if request.method == 'GET':
        return get_user_permissions(request, community_id, user_id)
    elif request.method == 'PUT':
        return set_user_permissions(request, community_id, user_id)



def set_user_permissions(request, community_id, user_id):
    user = request.user
    try:
        community = Community.objects.get(id=community_id)
        target_user = BaseUser.objects.get(id=user_id)
    except (Community.DoesNotExist, BaseUser.DoesNotExist):
        return Response({"detail": "Not found."}, status=404)

    # Check if requestor is admin
    if not CommunityMembership.objects.filter(user=user, community=community, role='admin').exists():
        return Response({"detail": "Unauthorized."}, status=403)

    # Validate payload
    perms = request.data.get('permissions')
    if not isinstance(perms, dict):
        return Response({"detail": "Invalid format for permissions."}, status=400)

    cp, _ = CommunityPermission.objects.get_or_create(community=community, user=target_user)
    cp.permissions = perms
    cp.save()

    return Response({"success": True, "user_id": target_user.id, "permissions": cp.permissions})


def get_user_permissions(request, community_id, user_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({"detail": "Community not found."}, status=404)

    try:
        user = BaseUser.objects.get(id=user_id)
    except BaseUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)

    # Only admins can view others' permissions (or allow self-view)
    if request.user != user:
        if not CommunityMembership.objects.filter(user=request.user, community=community, role='admin').exists():
            return Response({"detail": "Not authorized."}, status=403)

    from .models import CommunityPermission

    try:
        cp = CommunityPermission.objects.get(community=community, user=user)
        return Response({
            "user_id": user.id,
            "username": user.username,
            "permissions": cp.permissions
        })
    except CommunityPermission.DoesNotExist:
        # Fallback to admin default
        try:
            cm = CommunityMembership.objects.get(user=user, community=community)
            if cm.role == 'admin':
                from .permissions_defaults import DEFAULT_ADMIN_PERMISSIONS
                return Response({
                    "user_id": user.id,
                    "username": user.username,
                    "permissions": DEFAULT_ADMIN_PERMISSIONS
                })
        except CommunityMembership.DoesNotExist:
            pass

        return Response({
            "user_id": user.id,
            "username": user.username,
            "permissions": {}
        })

