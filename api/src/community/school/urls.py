from django.urls import path
from . import views

urlpatterns = [
    path("school/<uuid:community_id>/assignments/", views.get_assignments, name="get_assignments"),
    path("school/<uuid:community_id>/grades/", views.get_grades, name="get_grades"),
]
