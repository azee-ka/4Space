# admin.py

from django.contrib import admin
from .models import Post, MediaFile

admin.site.register(Post)
admin.site.register(MediaFile)
