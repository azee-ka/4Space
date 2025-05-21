# community/tab_registry.py

from ..community.school.models import CommunityGrade, CommunityAssignment
from ..community.startup.models import FundingRound

TAB_REGISTRY = {
  "school": {
    "grades": {
      "label": "Grades",
      "model": CommunityGrade,
      "icon": "📊",
      "route": "/api/school/{community_id}/grades/"
    },
    "assignments": {
      "label": "Assignments",
      "model": CommunityAssignment,
      "icon": "📚",
      "route": "/api/school/{community_id}/assignments/"
    },
  },
  "startup": {
    "funding": {
      "label": "Funding",
      "model": FundingRound,
      "icon": "💸",
      "route": "/api/startup/{community_id}/funding/"
    }
  }
}




TAB_REGISTRY_FLAT = {}

for category, tabs in TAB_REGISTRY.items():
    for tab_key, tab_data in tabs.items():
        TAB_REGISTRY_FLAT[tab_key] = {
            "category": category,
            **tab_data
        }
