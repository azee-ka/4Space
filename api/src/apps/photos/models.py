import uuid
from django.db import models
from ...user.interactUser.models import InteractUser
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime

import exifread
from moviepy.editor import VideoFileClip
from datetime import datetime
from PIL import Image
import subprocess
import os
from PIL import Image
from moviepy.editor import VideoFileClip
import subprocess

class Album(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(InteractUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class PhotoElement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='media/', null=True, blank=True)
    media_type = models.CharField(max_length=50, blank=True)  # e.g., 'image', 'video', 'audio'
    uploaded_at = models.DateTimeField(auto_now_add=True)
    original_media_datetime = models.DateTimeField(default=datetime.now, blank=True)
    user = models.ForeignKey(InteractUser, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, related_name='photos', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        extracted_datetime = self.extract_datetime_from_metadata()
        print(f'extracted_datetime {extracted_datetime}')
        if extracted_datetime:
            self.original_media_datetime = extracted_datetime
        super(PhotoElement, self).save(*args, **kwargs)
    
    def extract_datetime_from_metadata(self):
        try:
            if self.media_type == 'image':
                with open(self.file.path, 'rb') as f:
                    # Try to read metadata using exifread for all image types
                    tags = exifread.process_file(f, details=False)
                    if 'EXIF DateTimeOriginal' in tags:
                        return datetime.strptime(str(tags['EXIF DateTimeOriginal']), '%Y:%m:%d %H:%M:%S')
                    
                    # If EXIF DateTimeOriginal is not found, try to extract using Pillow
                    with Image.open(f) as img:
                        exif = img.getexif()
                        if exif and 36867 in exif:
                            return datetime.strptime(exif[36867], '%Y:%m:%d %H:%M:%S')

            elif self.media_type == 'video':
                clip = VideoFileClip(self.file.path)
                return clip.reader.metadata.get('creation_time', None)

        except Exception as e:
            print(f"Error extracting metadata: {e}")

        print("Using uploaded_at as fallback.")
        return self.uploaded_at