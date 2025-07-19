# urls.py

from django.urls import path
from . import views

urlpatterns = [
    path("calculator/solve/", views.solve_expression, name="solve-expression"),
    path("calculator/history/", views.user_calculations, name="calculator-history"),
]
