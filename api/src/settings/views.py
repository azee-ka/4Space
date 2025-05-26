from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserSetting
from .serializers import UserSettingSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_user_settings(request):
    user = request.user
    data = request.data  # expected: { category: 'display', settings: { key: value, ... } }

    category = data.get('category')
    settings = data.get('settings')

    if not category or not isinstance(settings, dict):
        return Response({'error': 'Invalid format'}, status=400)

    for key, value in settings.items():
        UserSetting.objects.update_or_create(
            user=user,
            category=category,
            key=key,
            defaults={'value': value}
        )

    return Response({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_settings(request):
    user = request.user
    category = request.query_params.get('category')

    settings = UserSetting.objects.filter(user=user)
    if category:
        settings = settings.filter(category=category)

    serializer = UserSettingSerializer(settings, many=True)
    return Response(serializer.data)
