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
    CommunityMemberSerializer,
)
from ..user.models import BaseUser
from ..notifications.models import Notification
from .permissions_defaults import DEFAULT_MEMBER_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS


def get_community_or_404_by_slug(slug):
    # case-insensitive lookup
    return get_object_or_404(Community, slug__iexact=slug)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_communities(request):
    communities = Community.objects.all().order_by('-created_at')
    serializer = CommunityDetailSerializer(communities, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_members(request, slug):
    community = get_community_or_404_by_slug(slug)
    if not CommunityMembership.objects.filter(user=request.user, community=community, role='admin').exists():
        return Response({"detail": "Unauthorized."}, status=403)

    memberships = CommunityMembership.objects.filter(community=community).select_related('user')
    permissions_map = {
        (p.user_id): p.permissions
        for p in CommunityPermission.objects.filter(community=community)
    }

    members = []
    for m in memberships:
        user = m.user
        perms = permissions_map.get(user.id) or {}
        members.append({
            "user": user,
            "role": m.role,
            "permissions": perms,
        })

    serializer = CommunityMemberSerializer(members, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_community(request, slug):
    community = get_community_or_404_by_slug(slug)

    if community.visibility == 'public':
        membership, created = CommunityMembership.objects.get_or_create(
            user=request.user, community=community,
            defaults={'role': 'member'}
        )
        if created:
            CommunityPermission.objects.get_or_create(
                community=community,
                user=request.user,
                defaults={'permissions': DEFAULT_MEMBER_PERMISSIONS}
            )
        return Response({"detail": "Joined community successfully."})

    if community.visibility == 'invite':
        return Response({"detail": "Invitation required."}, status=403)

    return Response({"detail": "Private community."}, status=403)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user_to_community(request, slug):
    community = get_community_or_404_by_slug(slug)

    if not CommunityPermission.objects.filter(
        community=community, user=request.user,
        permissions__can_invite_members=True
    ).exists():
        return Response({"detail": "No invite permission."}, status=403)

    target_user_id = request.data.get('user_id')
    if not target_user_id:
        return Response({"detail": "Missing user_id."}, status=400)

    if str(request.user.id) == str(target_user_id):
        return Response({"detail": "Cannot invite yourself."}, status=400)

    target_user = get_object_or_404(BaseUser, id=target_user_id)
    if CommunityMembership.objects.filter(user=target_user, community=community).exists():
        return Response({"detail": "Already a member."}, status=409)

    already_invited = Notification.objects.filter(
        user=target_user,
        sender=request.user,
        title__icontains=community.name,
        status='pending'
    ).exists()
    if already_invited:
        return Response({"detail": "Already invited."}, status=409)

    Notification.objects.create(
        user=target_user,
        sender=request.user,
        title=f"Invitation to join {community.name}",
        message=f"{request.user.username} invited you to '{community.name}'.",
        type='action',
        status='pending',
        action_url=f"community/{community.slug}/accept-invitation/"
    )
    return Response({"detail": f"Invitation sent to {target_user.username}."})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_community_invitation(request, slug):
    community = get_community_or_404_by_slug(slug)
    if community.visibility != 'invite':
        return Response({"detail": "No invitation needed."}, status=400)

    membership, created = CommunityMembership.objects.get_or_create(
        user=request.user, community=community,
        defaults={'role': 'member'}
    )
    if not created:
        return Response({"detail": "Already a member."}, status=400)
    return Response({"detail": "Joined via invitation."})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def leave_community(request, slug):
    community = get_community_or_404_by_slug(slug)
    try:
        membership = CommunityMembership.objects.get(user=request.user, community=community)
    except CommunityMembership.DoesNotExist:
        return Response({"detail": "Not a member."}, status=400)

    if membership.role == 'admin' and community.created_by == request.user:
        return Response({
            "detail": "Transfer ownership first."
        }, status=403)

    membership.delete()
    return Response({"detail": "Left successfully."})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tabs_to_community(request, slug):
    community = get_community_or_404_by_slug(slug)
    if not CommunityMembership.objects.filter(
        user=request.user, community=community,
        role__in=["admin", "moderator"]
    ).exists():
        return Response({"detail": "Unauthorized."}, status=403)

    tabs_data = request.data.get("tabs", [])
    if not isinstance(tabs_data, list):
        return Response({"detail": "tabs must be a list"}, status=400)

    created_tabs = []
    base_order = community.tabs.count()
    from .serializers import CommunityTabCreateSerializer

    for i, tab_entry in enumerate(tabs_data):
        serializer = CommunityTabCreateSerializer(data=tab_entry)
        serializer.is_valid(raise_exception=True)
        key = serializer.validated_data["key"]
        tab, _ = CommunityTab.objects.get_or_create(
            community=community, key=key,
            defaults={"order": base_order + i, "is_active": True}
        )
        created_tabs.append(tab)

    out = CommunityTabSerializer(created_tabs, many=True)
    return Response({"success": True, "tabs": out.data})


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_community(request, slug):
    community = get_community_or_404_by_slug(slug)
    if not CommunityMembership.objects.filter(
        user=request.user, community=community,
        role__in=['admin', 'moderator']
    ).exists():
        return Response({"detail": "Unauthorized."}, status=403)

    serializer = CommunityUpdateSerializer(
        community, data=request.data,
        context={'request': request},
        partial=True
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    updated = serializer.save()
    out = CommunityDetailSerializer(updated, context={'request': request})
    return Response(out.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_community_by_slug(request, slug):
    community = get_community_or_404_by_slug(slug)
    serializer = CommunityDetailSerializer(community, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_community(request):
    serializer = CommunityCreateSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    community = serializer.save()
    CommunityTab.objects.create(
        community=community, key="home", order=0, is_active=True
    )
    return Response({"success": True, "slug": community.slug}, status=201)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_permissions(request, slug, user_id):
    # You can reuse the same slug lookup + permissions logic here...
    if request.method == 'GET':
        return get_user_permissions(request, slug, user_id)
    else:
        return set_user_permissions(request, slug, user_id)

# … implement get_user_permissions & set_user_permissions just as before, 
#    replacing Community.objects.get(id=community_id) 
#    with get_community_or_404_by_slug(slug) …




def set_user_permissions(request, slug, user_id):
    user = request.user
    try:
        community = get_community_or_404_by_slug(slug)
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



def get_user_permissions(request, slug, user_id):
    try:
        community = get_community_or_404_by_slug(slug)
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
