# communities/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Community, CommunityMembership, CommunityPermission, CommunityTab
from .serializers import (
    CommunityCreateSerializer, 
    CommunityDetailSerializer, 
    CommunityUpdateSerializer, 
    CommunityTabSerializer, 
    CommunityTabCreateSerializer, 
    CommunityMemberSerializer
)
from ..user.models import BaseUser
from ..notifications.models import Notification
from .permissions_defaults import DEFAULT_MEMBER_PERMISSIONS


@api_view(['GET'])
@permission_classes([AllowAny])
def list_communities(request):
    communities = Community.objects.all().order_by('-created_at')
    serializer = CommunityDetailSerializer(communities, many=True, context={'request': request})
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_members(request, community_id):
    community = get_object_or_404(Community, id=community_id)
    if not CommunityMembership.objects.filter(user=request.user, community=community, role='admin').exists():
        return Response({"detail": "Unauthorized."}, status=403)

    memberships = CommunityMembership.objects.filter(community=community).select_related('user')

    # Pre-fetch all permissions for efficiency
    permissions_map = {
        (str(p.user_id), str(p.community_id)): p.permissions
        for p in CommunityPermission.objects.filter(community=community)
    }

    # Collect info for each member
    members = []
    for m in memberships:
        user = m.user
        perms = permissions_map.get((str(user.id), str(community.id)))
        members.append({
            "user": user,
            "role": m.role,
            "permissions": perms or {},  # fallback to empty dict if not found
        })

    serializer = CommunityMemberSerializer(members, many=True)
    return Response(serializer.data)






@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    if community.visibility == 'public':
        membership, created = CommunityMembership.objects.get_or_create(
            user=request.user,
            community=community,
            defaults={'role': 'member'}
        )
        if created:
            CommunityPermission.objects.get_or_create(
                community=community,
                user=request.user,
                defaults={'permissions': DEFAULT_MEMBER_PERMISSIONS}
            )

        return Response({"detail": "Joined community successfully."}, status=200)

    elif community.visibility == 'invite':
        return Response({"detail": "This community requires an invitation to join."}, status=403)

    return Response({"detail": "This community is private and cannot be joined directly."}, status=403)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user_to_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    # Permission check
    if not CommunityPermission.objects.filter(
        community=community, user=request.user, permissions__can_invite_members=True
    ).exists():
        return Response({"detail": "You do not have permission to invite users."}, status=403)

    target_user_id = request.data.get('user_id')
    if not target_user_id:
        return Response({"detail": "Missing user_id in request."}, status=400)

    # Prevent self-invite
    if str(request.user.id) == str(target_user_id):
        return Response({"detail": "You cannot invite yourself."}, status=400)

    # Resolve target user
    target_user = get_object_or_404(BaseUser, id=target_user_id)

    # Already a member?
    if CommunityMembership.objects.filter(user=target_user, community=community).exists():
        return Response({"detail": "User is already a member of this community."}, status=409)

    # Check if there's already a pending invitation notification
    already_invited = Notification.objects.filter(
        user=target_user,
        sender=request.user,
        title__icontains=community.name,
        status='pending'
    ).exists()

    if already_invited:
        return Response({"detail": "User has already been invited."}, status=409)

    # Create notification
    Notification.objects.create(
        user=target_user,
        sender=request.user,
        title=f"Invitation to join {community.name}",
        message=f"{request.user.username} has invited you to join the community '{community.name}'.",
        type='action',
        status='pending',
        action_url=f"community/{community.id}/accept-invitation/"
    )

    return Response({"detail": f"Invitation sent to {target_user.username}."}, status=200)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_community_invitation(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    if community.visibility != 'invite':
        return Response({"detail": "This community doesn't require invitations."}, status=400)

    membership, created = CommunityMembership.objects.get_or_create(user=request.user, community=community, defaults={'role': 'member'})
    if not created:
        return Response({"detail": "You are already a member."}, status=400)

    return Response({"detail": "Successfully joined the community."})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def leave_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    try:
        membership = CommunityMembership.objects.get(user=request.user, community=community)
    except CommunityMembership.DoesNotExist:
        return Response({"detail": "You are not a member of this community."}, status=400)

    # Prevent the creator (admin) from leaving for now
    if membership.role == 'admin' and community.created_by == request.user:
        return Response({
            "detail": "You are the creator of this community. Transfer ownership before leaving."
        }, status=403)

    membership.delete()
    return Response({"detail": "Left community successfully."})




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

    perms = request.data.get('permissions')
    if not isinstance(perms, dict):
        return Response({"detail": "Invalid format for permissions."}, status=400)

    cp, created = CommunityPermission.objects.get_or_create(community=community, user=target_user)
    # Instead of overwriting all:
    cp.permissions = {**cp.permissions, **perms}
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
        try:
            cm = CommunityMembership.objects.get(user=user, community=community)
            from .permissions_defaults import DEFAULT_ADMIN_PERMISSIONS, DEFAULT_MEMBER_PERMISSIONS
            if cm.role == 'admin':
                return Response({
                    "user_id": user.id,
                    "username": user.username,
                    "permissions": DEFAULT_ADMIN_PERMISSIONS
                })
            else:
                return Response({
                    "user_id": user.id,
                    "username": user.username,
                    "permissions": DEFAULT_MEMBER_PERMISSIONS
                })
        except CommunityMembership.DoesNotExist:
            pass

        return Response({
            "user_id": user.id,
            "username": user.username,
            "permissions": {}
        })
