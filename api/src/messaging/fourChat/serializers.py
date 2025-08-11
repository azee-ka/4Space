# anonchat/serializers.py
from rest_framework import serializers
from .models import ChatSession, Message, PingEvent, Report


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender_pid", "text", "ts"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "a_pid",
            "b_pid",
            "a_meta",
            "b_meta",
            "started_at",
            "ended_at",
            "messages",
        ]


class PingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PingEvent
        fields = ["id", "from_pid", "to_pid", "ticket", "created_at"]


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "session", "reason", "details", "created_at"]