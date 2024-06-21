import uuid
from django.db import models
from ...user.interactUser.models import InteractUser
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime

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
        if not self.original_media_datetime:
            self.original_media_datetime = self.extract_datetime_from_metadata()
        super(PhotoElement, self).save(*args, **kwargs)

    def extract_datetime_from_metadata(self):
        try:
            print("runnignigigi")
            image = Image.open(self.file)
            exif_data = image._getexif()
            if exif_data is not None:
                for tag, value in exif_data.items():
                    decoded_tag = TAGS.get(tag, tag)
                    if decoded_tag == 'DateTimeOriginal':
                        # Convert EXIF datetime string to Python datetime
                        print(f"Found DateTimeOriginal tag with value: {value}")
                        return datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
        except Exception as e:
            print(f"Error extracting metadata: {e}")
            # Raise the exception to see the full traceback
            raise e
        # Fall back to uploaded_at if datetime not found or error occurred
        return self.uploaded_at

