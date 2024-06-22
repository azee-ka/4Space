import uuid
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from ...user.interactUser.models import InteractUser
from PIL import Image, ExifTags
from datetime import datetime
import exifread
from moviepy.editor import VideoFileClip
import os

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
    last_modified_datetime = models.DateTimeField(default=datetime.now, blank=True)
    user = models.ForeignKey(InteractUser, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, related_name='photos', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Check for a custom attribute to avoid recursion
        if not hasattr(self, '_metadata_extracted'):
            # Save the file first to ensure it is available on the filesystem
            super(PhotoElement, self).save(*args, **kwargs)
            
            # Extract metadata
            extracted_creation_datetime, extracted_modified_datetime = self.extract_datetime_from_metadata()
            print(f'extracted_creation_datetime {extracted_creation_datetime}, extracted_modified_datetime {extracted_modified_datetime}')
            
            if extracted_creation_datetime:
                self.original_media_datetime = extracted_creation_datetime
            if extracted_modified_datetime:
                self.last_modified_datetime = extracted_modified_datetime

            # Set the flag to avoid recursion and save again
            self._metadata_extracted = True

            # Temporarily disconnect the signal
            post_save.disconnect(extract_metadata, sender=PhotoElement)
            try:
                # Use update to avoid creating a new instance with the same ID
                PhotoElement.objects.filter(pk=self.pk).update(
                    original_media_datetime=self.original_media_datetime,
                    last_modified_datetime=self.last_modified_datetime
                )
            finally:
                # Reconnect the signal
                post_save.connect(extract_metadata, sender=PhotoElement)

            # Remove the flag after saving to reset the state
            del self._metadata_extracted
        else:
            super(PhotoElement, self).save(*args, **kwargs)

    def extract_datetime_from_metadata(self):
        creation_datetime = None
        modified_datetime = None
        try:
            if self.media_type == 'image':
                creation_datetime, modified_datetime = self.extract_datetime_from_image()
            elif self.media_type == 'video':
                creation_datetime, modified_datetime = self.extract_datetime_from_video()
        except Exception as e:
            print(f"Error extracting metadata: {e}")

        print("Using uploaded_at as fallback.")
        if not creation_datetime:
            creation_datetime = self.uploaded_at
        if not modified_datetime:
            modified_datetime = self.uploaded_at
        return creation_datetime, modified_datetime

    def extract_datetime_from_image(self):
        creation_datetime = None
        modified_datetime = None
        try:
            with open(self.file.path, 'rb') as f:
                # Try to read metadata using exifread for all image types
                tags = exifread.process_file(f, details=False)
                date_time_original = tags.get('EXIF DateTimeOriginal')
                date_time_digitized = tags.get('EXIF DateTimeDigitized')
                date_time = tags.get('Image DateTime')
                if date_time_original:
                    creation_datetime = datetime.strptime(str(date_time_original), '%Y:%m:%d %H:%M:%S')
                if date_time:
                    modified_datetime = datetime.strptime(str(date_time), '%Y:%m:%d %H:%M:%S')

            # If EXIF DateTimeOriginal is not found, try to extract using Pillow
            with Image.open(self.file.path) as img:
                exif = img._getexif()
                if exif:
                    for tag, value in exif.items():
                        decoded_tag = ExifTags.TAGS.get(tag, tag)
                        if decoded_tag == 'DateTimeOriginal':
                            creation_datetime = datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
                        if decoded_tag == 'DateTime':
                            modified_datetime = datetime.strptime(value, '%Y:%m:%d %H:%M:%S')

            # Fallback to file's metadata
            if not creation_datetime:
                creation_datetime = datetime.fromtimestamp(os.path.getctime(self.file.path))
            if not modified_datetime:
                modified_datetime = datetime.fromtimestamp(os.path.getmtime(self.file.path))
        except Exception as e:
            print(f"Error extracting image metadata: {e}")

        return creation_datetime, modified_datetime

    def extract_datetime_from_video(self):
        creation_datetime = None
        modified_datetime = None
        try:
            clip = VideoFileClip(self.file.path)
            creation_time = clip.reader.metadata.get('creation_time')
            if creation_time:
                creation_datetime = datetime.strptime(creation_time, '%Y-%m-%dT%H:%M:%S.%fZ')
            modified_time = datetime.fromtimestamp(os.path.getmtime(self.file.path))
            if modified_time:
                modified_datetime = modified_time
        except Exception as e:
            print(f"Error extracting video metadata: {e}")

        return creation_datetime, modified_datetime

@receiver(post_save, sender=PhotoElement)
def extract_metadata(sender, instance, **kwargs):
    if instance.file and instance.media_type and not hasattr(instance, '_metadata_extracted'):
        # Extract metadata and update the instance fields
        extracted_creation_datetime, extracted_modified_datetime = instance.extract_datetime_from_metadata()
        print(f'extracted_creation_datetime {extracted_creation_datetime}, extracted_modified_datetime {extracted_modified_datetime}')
        
        if extracted_creation_datetime:
            instance.original_media_datetime = extracted_creation_datetime
        if extracted_modified_datetime:
            instance.last_modified_datetime = extracted_modified_datetime

        # Temporarily disconnect the signal
        post_save.disconnect(extract_metadata, sender=PhotoElement)
        try:
            # Use update to avoid creating a new instance with the same ID
            PhotoElement.objects.filter(pk=instance.pk).update(
                original_media_datetime=instance.original_media_datetime,
                last_modified_datetime=instance.last_modified_datetime
            )
        finally:
            # Reconnect the signal
            post_save.connect(extract_metadata, sender=PhotoElement)
