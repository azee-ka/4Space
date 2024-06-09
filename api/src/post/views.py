# src/post/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView, CreateAPIView
from .models import Post, Comment, MediaFile
from .serializers import PostSerializer, CommentSerializer, MediaFileSerializer

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
class PostRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

class CreateCommentView(CreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer