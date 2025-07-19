# models.py

from django.db import models
from django.conf import settings

class CalculatorExpression(models.Model):
    user = models.ForeignKey(settings.AUTH_PROFILE_MODEL, on_delete=models.CASCADE, related_name="calculator_expressions")
    input_latex = models.TextField()
    output_latex = models.TextField(blank=True, null=True)
    raw_result = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expression by {self.user} at {self.created_at}"
