from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['content_type', 'object_id', 'reasons', 'custom_reason']

    def validate(self, data):
        if 'other' in data['reasons'] and not data.get('custom_reason'):
            raise serializers.ValidationError("Custom reason must be provided if 'Other' is selected.")
        return data
