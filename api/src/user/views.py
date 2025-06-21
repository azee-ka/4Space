from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .models import BaseUser
from .serializers import (
    MinimalUserSerializer, 
    MyProfileSerializer, 
    PartialProfileSerializer, 
    FullProfileSerializer, 
    EditUserInfoSerializer,
    HandleSerializer,
    ProfessionalProfileSerializer,
    )
from django.shortcuts import get_object_or_404
from ..notifications.models import Notification




@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_professional_profile(request, username=None):
    viewer = request.user
    is_me  = username is None or username == viewer.username

    # GET handler
    if request.method == 'GET':
        user = viewer if is_me else get_object_or_404(BaseUser, username=username)
        serializer = ProfessionalProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # PATCH handler
    if not is_me:
        return Response(
            {'detail': "Cannot edit someone else’s profile."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Let the serializer handle professional_tab_order (and all other fields)
    serializer = ProfessionalProfileSerializer(viewer, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response({'message': 'Profile updated.'}, status=status.HTTP_200_OK)




@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def handle_list_and_switch(request):
    """
    GET:  list all handles for the current AuthUser
    POST: accept a full `username_handles` array:
      - create any new handles
      - update existing ones
      - delete any removed
      - enforce max=4 & exactly one active
      - set auth_user.active_handle to the one with is_active=True
    """
    auth_user = request.user.account

    # 1) GET → just list
    if request.method == 'GET':
        qs = auth_user.handles.all()
        return Response(
            HandleSerializer(qs, many=True, context={'request': request}).data
        )

    # 2) Must have the full list in JSON body
    handles_payload = request.data.get('username_handles')
    if handles_payload is None:
        return Response(
            {'detail': 'Must provide "username_handles" in request body.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 3) Business rules
    if len(handles_payload) > 4:
        return Response(
            {'detail': 'You may have at most 4 handles.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if sum(1 for h in handles_payload if h.get('is_active')) != 1:
        return Response(
            {'detail': 'Exactly one handle must be active.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 4) Delete any dropped handles
    existing_ids = { str(h.id) for h in auth_user.handles.all() }
    payload_ids  = { str(h.get('id')) for h in handles_payload if h.get('id') }
    to_delete    = existing_ids - payload_ids
    if to_delete:
        BaseUser.objects.filter(account=auth_user, id__in=to_delete).delete()

    # 5) Create or update each handle
    for h in handles_payload:
        hid = h.get('id')
        if not hid or hid.startswith('new-'):
            # new handle
            new = BaseUser.objects.create(
                account  = auth_user,
                username = h['username'],
                label    = h.get('label', '')
            )
            h['id'] = str(new.id)
        else:
            try:
                obj = auth_user.handles.get(pk=hid)
                obj.username = h.get('username', obj.username)
                obj.label    = h.get('label',    obj.label)
                obj.save()
            except BaseUser.DoesNotExist:
                continue

    # 6) Switch active_handle
    active_payload = next(h for h in handles_payload if h['is_active'])
    active = auth_user.handles.get(pk=active_payload['id'])
    auth_user.active_handle = active
    auth_user.save(update_fields=['active_handle'])
    request.session['active_handle'] = str(active.id)

    # 7) Return the newly-active handle
    return Response(
        HandleSerializer(active, context={'request': request}).data,
        status=status.HTTP_200_OK
    )





@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_account(request):
    """
    Link the newly logged-in account with the current user's session.
    Frontend stores accounts locally (e.g. in cookies or secure localStorage),
    and this endpoint logs it on backend for record if needed.
    """
    linked_username = request.data.get("username")
    if not linked_username:
        return Response({'error': 'Username is required.'}, status=400)

    if linked_username == request.user.username:
        return Response({'message': 'Already current account.'}, status=200)

    # Optional: store linked accounts on backend if needed
    # You can create a model/table if you want a persistent record

    return Response({'message': 'Account added for switching.'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_accounts(request):
    """
    Return the list of user accounts saved locally (client-side) + current session.
    """
    # On backend, just return the current user
    from .serializers import MinimalUserSerializer
    return Response([MinimalUserSerializer(request.user).data])




@api_view(['POST'])
@permission_classes([AllowAny])  # Not IsAuthenticated because they might be switching TO a new login
def switch_account(request):
    """
    Accepts credentials/token and switches the session to that account.
    This would typically be a login call + storing session for switch.
    """
    from django.contrib.auth import authenticate, login

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        return Response({'message': 'Switched account successfully.'})
    else:
        return Response({'error': 'Invalid credentials.'}, status=401)








@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_view(request, username):
    viewer = request.user if request.user.is_authenticated else None
    profile_user = get_object_or_404(BaseUser, username=username)

    is_following = (
      viewer in profile_user.followers.all()
      if viewer else False
    )
    follow_request_status = None
    if profile_user.is_private_profile and viewer and not is_following:
        try:
            notif = Notification.objects.get(
                sender=viewer,
                user=profile_user,
                type="action",
                status__in=["pending","approved","disapproved"],
                message__icontains="Requested to follow your account."
            )
            follow_request_status = notif.status
        except Notification.DoesNotExist:
            pass

    # Decide serializer + view_type
    if viewer == profile_user:
        serializer = MyProfileSerializer(profile_user)
        view_type = 'self'
    else:
        if profile_user.is_private_profile and not is_following:
            serializer = PartialProfileSerializer(profile_user)
            view_type = 'partial'
        else:
            serializer = FullProfileSerializer(profile_user)
            view_type = 'full'

    data = {
        **serializer.data,
        'view_type': view_type,
        'interact': {
            'is_following': is_following,
            'follow_request_status': follow_request_status
        }
    }
    return Response(data, status=200)







@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def edit_basic_info(request):
    base_user = request.user

    if request.method == 'GET':
        serializer = EditUserInfoSerializer(base_user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = EditUserInfoSerializer(base_user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'profile_image' in request.FILES:
                base_user.profile_image = request.FILES['profile_image']
                base_user.save()
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    base_user = request.user  # This gives you the authenticated user of type BaseUser
    serializer = MinimalUserSerializer(base_user)
    return Response(serializer.data, status=200)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def toggle_profile_visibility(request):
    """
    Handle profile visibility:
    - GET: Return the current `is_private_profile` status.
    - POST: Toggle the `is_private_profile` field for the authenticated user.
    """
    user = request.user

    if request.method == 'GET':
        # Return the current visibility status
        return Response(
            { "is_private_profile": user.is_private_profile },
            status=status.HTTP_200_OK
        )
    elif request.method == 'POST':
        # Toggle the `is_private_profile` field
        user.is_private_profile = not user.is_private_profile
        user.save()

        return Response(
            {
                "message": "Profile visibility updated successfully.",
                "is_private_profile": user.is_private_profile,
            },
            status=status.HTTP_200_OK
        )