# anonchat/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404

from .models import ChatSession, Message, PingEvent, Report
from .serializers import (
    ChatSessionSerializer,
    MessageSerializer,
    PingEventSerializer,
    ReportSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_sessions(request):
    """
    Debug/admin helper to inspect recent sessions.
    """
    qs = ChatSession.objects.order_by("-started_at")[:50]
    data = ChatSessionSerializer(qs, many=True).data
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_session_messages(request, session_id):
    sess = get_object_or_404(ChatSession, pk=session_id)
    data = MessageSerializer(sess.messages.all(), many=True).data
    return Response(data)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_report(request):
    ser = ReportSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    ser.save()
    return Response(ser.data, status=status.HTTP_201_CREATED)