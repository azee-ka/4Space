# serializers.py

from rest_framework import serializers
from .models import CalculatorExpression

class CalculatorExpressionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculatorExpression
        fields = ['id', 'input_latex', 'output_latex', 'raw_result', 'created_at']
