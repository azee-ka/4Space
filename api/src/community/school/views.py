from rest_framework import generics
from .models import CommunityGrade, CommunityAssignment
from .serializers import CommunityGradeSerializer, CommunityAssignmentSerializer

class CommunityGradeListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunityGradeSerializer

    def get_queryset(self):
        return CommunityGrade.objects.filter(community_id=self.kwargs['community_id'])

    def perform_create(self, serializer):
        serializer.save(community_id=self.kwargs['community_id'])

class CommunityAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunityAssignmentSerializer

    def get_queryset(self):
        return CommunityAssignment.objects.filter(community_id=self.kwargs['community_id'])

    def perform_create(self, serializer):
        serializer.save(community_id=self.kwargs['community_id'])
