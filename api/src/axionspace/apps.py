from django.apps import AppConfig

class AxionSpaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.axionspace'

    def ready(self):
        import src.axionspace.signals  # Load signals when the app is ready
