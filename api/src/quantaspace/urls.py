from django.urls import path, include
from . import views

urlpatterns = [
    # Packet views
    path('packet/create-packet/', views.create_packet, name='create-packet' ),
    path('packet/<uuid:packet_id>/', views.get_packet, name='get-packet'),
    
    path('packet/<uuid:packet_id>/like-dislike/', views.toggle_like_dislike, name='like-dislike-packet'),


    # Timeline
    path('timeline/', include('src.quantaspace.timeline.urls'))
]