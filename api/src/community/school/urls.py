from django.urls import path
from .views import CommunityGradeListCreateView, CommunityAssignmentListCreateView

urlpatterns = [
    path('<uuid:community_id>/grades/', CommunityGradeListCreateView.as_view(), name='community_grades'),
    path('<uuid:community_id>/assignments/', CommunityAssignmentListCreateView.as_view(), name='community_assignments'),
]
