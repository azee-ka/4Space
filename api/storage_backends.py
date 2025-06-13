# api/storage_backends.py

import os
from storages.backends.azure_storage import AzureBlobStorage

class AzureMediaStorage(AzureBlobStorage):
    account_name = os.getenv("AZURE_ACCOUNT_NAME")
    account_key = os.getenv("AZURE_ACCOUNT_KEY")
    container_name = os.getenv("AZURE_MEDIA_CONTAINER", "media")
    expiration_secs = None  # Prevent expiring URLs

    def __init__(self, *args, **kwargs):
        print("✅ Using AzureBlobStorage backend")
        super().__init__(*args, **kwargs)
