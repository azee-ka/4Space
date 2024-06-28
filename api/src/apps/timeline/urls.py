from django.urls import path, include

urlpatterns = [
    path('timeline/', include('src.apps.timeline.timeline.urls')),
    path('post/', include('src.apps.timeline.post.urls')),
    path('explore/', include('src.apps.timeline.explore.urls')),
]