from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ThreadPost, VisualPost
from ..serializers import PostRetrieveSerializer, MinimalVisualPostSerializer

from rest_framework.pagination import LimitOffsetPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_posts(request):
    post_type = request.GET.get('post_type', None)
    paginator = LimitOffsetPagination()

    if post_type == "Visual":
        posts = VisualPost.objects.all().order_by('-created_at')
        paginated = paginator.paginate_queryset(posts, request)
        data = [MinimalVisualPostSerializer(p, context={'request': request}).data for p in paginated]
    elif post_type == "Thread":
        posts = ThreadPost.objects.all().order_by('-created_at')
        paginated = paginator.paginate_queryset(posts, request)
        data = [PostRetrieveSerializer(p, context={'request': request}).data for p in paginated]
    else:
        # Combined case, if you support it
        all_posts = list(ThreadPost.objects.all()) + list(VisualPost.objects.all())
        all_posts.sort(key=lambda x: x.created_at, reverse=True)
        paginated = paginator.paginate_queryset(all_posts, request)
        data = []
        for p in paginated:
            if isinstance(p, ThreadPost):
                data.append(PostRetrieveSerializer(p, context={'request': request}).data)
            else:
                data.append(MinimalVisualPostSerializer(p, context={'request': request}).data)

    return paginator.get_paginated_response(data)
