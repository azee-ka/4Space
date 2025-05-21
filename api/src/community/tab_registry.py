from .school.models import CommunityAssignment, CommunityGrade
from .school.serializers import CommunityAssignmentSerializer, CommunityGradeSerializer
from .school.views import get_assignments, get_grades  # we'll create these

from .general.models import DiscussionPost
from .general.serializers import DiscussionPostSerializer

TAB_REGISTRY = {
    "general": {
        "discussion": {
            "label": "Discussion",
            "icon": "📚",
            "model": DiscussionPost,
            "serializer": DiscussionPostSerializer,
            "view": get_assignments,
            "route": "general/<uuid:community_id>/discussion/"
        },
    },
    "school": {
        "assignments": {
            "label": "Assignments",
            "icon": "📚",
            "model": CommunityAssignment,
            "serializer": CommunityAssignmentSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/assignments/"
        },
        "grades": {
            "label": "Grades",
            "icon": "📊",
            "model": CommunityGrade,
            "serializer": CommunityGradeSerializer,
            "view": get_grades,
            "route": "school/<uuid:community_id>/grades/"
        }
    },
    # Add other categories here...
}

# Flat registry for quick lookup
TAB_REGISTRY_FLAT = {
    key: {**entry, "category": category}
    for category, tabs in TAB_REGISTRY.items()
    for key, entry in tabs.items()
}
