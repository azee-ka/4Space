from .school.models import CommunityAssignment, CommunityGrade
from .school.serializers import CommunityAssignmentSerializer, CommunityGradeSerializer
from .school.views import get_assignments, get_grades  # we'll create these

from .general.models import ExchangePost
from .general.serializers import ExchangePostSerializer

from .research.models import ResearchPublication, PeerReview, Preprint, Dataset, CollaborationCall
from .research.serializers import ResearchPublicationSerializer

TAB_REGISTRY = {
    "general": {
        "exchange": {
            "label": "Exchange",
            "icon": "📚",
            "model": ExchangePost,
            "serializer": ExchangePostSerializer,
            "view": get_assignments,
            "route": "general/<uuid:community_id>/exchange/"
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
    "research": {
        "publications": {
            "label": "Publications",
            "icon": "📚",
            "model": ResearchPublication,
            "serializer": CommunityAssignmentSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/publications/"
        },
        "peerreview": {
            "label": "Peer Review",
            "icon": "📚",
            "model": PeerReview,
            "serializer": ResearchPublicationSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/peerreview/"
        },
        "preprints": {
            "label": "Preprints",
            "icon": "📚",
            "model": Preprint,
            "serializer": CommunityAssignmentSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/preprints/"
        },
        "datasets": {
            "label": "Datasets",
            "icon": "📚",
            "model": Dataset,
            "serializer": CommunityAssignmentSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/dataset/"
        },
        "collaboration": {
            "label": "Collaboration",
            "icon": "📚",
            "model": CollaborationCall,
            "serializer": CommunityAssignmentSerializer,
            "view": get_assignments,
            "route": "school/<uuid:community_id>/collaboration/"
        },
    },
}

# Flat registry for quick lookup
TAB_REGISTRY_FLAT = {
    key: {**entry, "category": category}
    for category, tabs in TAB_REGISTRY.items()
    for key, entry in tabs.items()
}
