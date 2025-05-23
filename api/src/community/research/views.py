# research/views.py
from rest_framework import generics, permissions
from .models import ResearchPublication
from .serializers import ResearchPublicationSerializer

class ResearchPublicationListCreate(generics.ListCreateAPIView):
    serializer_class = ResearchPublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ResearchPublication.objects.filter(community_id=self.kwargs['community_id']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            community_id=self.kwargs['community_id']
        )