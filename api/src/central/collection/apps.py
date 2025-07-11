# src/central/collection/apps.py

from django.apps import AppConfig

class CollectionConfig(AppConfig):
    name = 'src.central.collection'

    def ready(self):
        import src.central.collection.signals
