from django.http import JsonResponse
from ..models import Chat, Message
from django.shortcuts import get_object_or_404
import json

def save_message(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        chat_id = data.get('chat_id')
        content = data.get('content')

        if chat_id and content:
            chat = get_object_or_404(Chat, pk=chat_id)
            message = Message(chat=chat, sender=request.user, content=content)
            message.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'error': 'Missing chat_id or content'}, status=400)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
