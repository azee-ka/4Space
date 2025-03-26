from django.apps import AppConfig

class UserConfig(AppConfig):
    name = 'src.user'
    verbose_name = 'User'

    def ready(self):
        import src.user.signals  # Register signals when the app is ready
