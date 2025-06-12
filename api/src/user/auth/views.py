from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from ..serializers import UserCreateSerializer
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authtoken.models import Token
from ...organization.models import OrganizationMembership
import traceback
from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
import requests

User = get_user_model()

import os
from django.core.files.base import ContentFile
from urllib.request import urlopen
from django.core.files.temp import NamedTemporaryFile


    
    
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    try:
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token not provided."}, status=400)

        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get('email')
        name = idinfo.get('name') or ''
        first_name = name.split(' ')[0]
        last_name = ' '.join(name.split(' ')[1:])
        picture_url = idinfo.get('picture')

        if not email:
            return Response({"error": "Email not found in token."}, status=400)

        username = email.split('@')[0]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "role": "professional",
                "is_verified": True,
            }
        )

        if created and picture_url:
            try:
                img_temp = urlopen(picture_url)
                image_content = ContentFile(img_temp.read())
                user.profile_image.save(f"{username}_google.jpg", image_content, save=True)
            except Exception as e:
                print("Failed to download profile image:", e)

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "profile_image": user.profile_image.url if user.profile_image else None
            }
        })

    except ValueError:
        return Response({"error": "Invalid token"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)






@api_view(['GET'])
@permission_classes([AllowAny])
def github_login_redirect(request):
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=user:email"
    )
    return redirect(url)

@api_view(['GET'])
@permission_classes([AllowAny])
def github_callback(request):
    code = request.query_params.get("code")
    if not code:
        return Response({"error": "Missing code"}, status=400)

    # Step 1: Exchange code for token
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        },
    )
    access_token = token_res.json().get("access_token")
    if not access_token:
        return Response({"error": "Token exchange failed"}, status=400)

    # Step 2: Get user info
    user_res = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"},
    )
    user_data = user_res.json()

    # Step 3: Get primary email
    email_res = requests.get(
        "https://api.github.com/user/emails",
        headers={"Authorization": f"token {access_token}"},
    )
    email_list = email_res.json()
    email = next((e['email'] for e in email_list if e['primary'] and e['verified']), None)

    if not email:
        return Response({"error": "No verified email found"}, status=400)

    username = user_data.get("login") or email.split("@")[0]
    name = user_data.get("name") or ""
    avatar_url = user_data.get("avatar_url")

    first_name = name.split(' ')[0] if name else ''
    last_name = ' '.join(name.split(' ')[1:]) if name else ''

    user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": user_data.get("login") or email.split("@")[0],
                "first_name": user_data.get("name") or "",
                "role": "professional",
                "is_verified": True,
            },
    )

    # Download and save GitHub avatar
    avatar_url = user_data.get("avatar_url")
    if created and avatar_url:
        try:
            image_content = ContentFile(urlopen(avatar_url).read())
            user.profile_image.save(f"{user.username}_github.jpg", image_content, save=True)
        except Exception as e:
            print("Failed to download GitHub image:", e)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "profile_image": user.profile_image.url if user.profile_image else None
        }
    })





@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        data = request.data.copy()
        acc_type = data.get("type")
        org_role = data.get("org_role")

        if acc_type not in ['organization', 'individual']:
            return Response({"error": "Invalid account type."}, status=400)

        data['role'] = 'professional'

        serializer = UserCreateSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(request.data['password'])
            user.save()

            token, _ = Token.objects.get_or_create(user=user)
            response_data = {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role,
                    'account_type': acc_type,
                },
                'token': token.key,
            }
            if acc_type == 'organization' and org_role:
                response_data['user']['org_role'] = org_role

            return Response(response_data, status=201)
        return Response(serializer.errors, status=400)

    except Exception as e:
        traceback_str = traceback.format_exc()
        print(traceback_str)  # will appear in Render Logs
        return Response({"error": str(e)}, status=500)



@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([TokenAuthentication])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        # Check all memberships for approval
        unapproved_memberships = OrganizationMembership.objects.filter(user=user, is_approved=False)
        if unapproved_memberships.exists():
            return Response(
                {"message": "Your account is pending approval by an organization."},
                status=403
            )

        # Login the user and generate a new token
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        response_data = {'user': {'id': user.id, 'username': user.username, 'role': user.role}, 'token': token.key}
        return Response(response_data, status=200)
    else:
        return Response({"message": "Invalid credentials"}, status=401)
    
    
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_view(request):
    user = request.user

    # Optionally revoke the token (good practice)
    Token.objects.filter(user=user).delete()

    # Delete the user
    user.delete()

    return Response({"message": "User account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)