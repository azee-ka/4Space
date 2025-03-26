from django.urls import path
from . import views

urlpatterns = [
    # Space endpoints
    path('spaces/', views.list_spaces, name='list_spaces'),
    path('create/', views.create_space, name='create_space'),
    path('<uuid:space_id>/', views.space_detail, name='space_detail'),
    path('<uuid:space_id>/update/', views.update_space, name='update_space'),
    path('<uuid:space_id>/editable-info/', views.editable_space_info, name='editable_space_info'),
    path('<uuid:space_id>/delete/', views.delete_space, name='delete_space'),

    # Space membership endpoints
    path('<int:space_id>/members/', views.add_member, name='add_member'),
    path('<int:space_id>/members/<int:membership_id>/update/', views.update_membership, name='update_membership'),
    path('<int:space_id>/members/<int:membership_id>/remove/', views.remove_member, name='remove_member'),

    # Widget endpoints
    path('<int:space_id>/widgets/', views.list_widgets, name='list_widgets'),
    path('<int:space_id>/widgets/create/', views.create_widget, name='create_widget'),
    path('widgets/<int:widget_id>/', views.widget_detail, name='widget_detail'),
    path('widgets/<int:widget_id>/update/', views.update_widget, name='update_widget'),
    path('widgets/<int:widget_id>/delete/', views.delete_widget, name='delete_widget'),
]
