from django.shortcuts import get_object_or_404
from django.db.models import Q
import uuid
from django.core.files.base import ContentFile
import base64
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ...user.interactUser.models import InteractUser
from ...user.baseUser.models import BaseUser
from ...user.baseUser.serializers import IdealUserSerializer
from rest_framework import status

from django.core.exceptions import ObjectDoesNotExist

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    search_query = request.GET.get('query', '')

    try:
        users = BaseUser.objects.filter(Q(username__icontains=search_query))
        serializer = IdealUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ObjectDoesNotExist:
        # No users found
        return Response([], status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Other unexpected errors
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)