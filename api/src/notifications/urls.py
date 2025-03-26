from django.urls import path
from .views import NotificationListView, MarkNotificationAsReadView, NotificationDetailView

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification-list'),
    path('notification/<int:notification_id>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('mark-as-read/<int:notification_id>/', MarkNotificationAsReadView.as_view(), name='mark-as-read'),
]
