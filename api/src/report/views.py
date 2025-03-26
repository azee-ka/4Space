from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from .models import Report
from .serializers import ReportSerializer

CONTENT_TYPE_MAPPING = {
    'message': 'Message',  
    'flare': 'Flare',
    'packet': 'Packet',
    'entry': 'Entry',
    'comment': 'Comment',
}

@api_view(['POST'])
def report_content(request):
    content_type_name = request.data.get('content_type')  # String like 'message', 'flare', etc.
    object_id = request.data.get('object_id')  # The object ID to report

    model_name = CONTENT_TYPE_MAPPING.get(content_type_name.lower())
    
    if not model_name:
        return Response({'error': f'Content type "{content_type_name}" is invalid.'}, status=400)

    try:
        content_types = ContentType.objects.filter(model=model_name.lower())

        if content_types.count() > 1:
            return Response({'error': f'Multiple ContentTypes found for model "{model_name}".'}, status=400)
        elif content_types.count() == 0:
            return Response({'error': f'No ContentType found for model "{model_name}".'}, status=400)
        
        content_type = content_types.first()

        model = content_type.model_class()

        try:
            content_object = model.objects.get(uuid=object_id)
        except ObjectDoesNotExist:
            return Response({'error': f'Object with ID {object_id} not found in model {model_name}.'}, status=404)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

    request.data['content_type'] = content_type.id
    request.data['object_id'] = object_id

    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(reporter=request.user, content_object=content_object)
        return Response({'status': 'reported'}, status=201)
    
    return Response(serializer.errors, status=400)
