from django.urls import path
from . import views

urlpatterns = [
    path('report-content/', views.report_content, name='report_content'),
]
