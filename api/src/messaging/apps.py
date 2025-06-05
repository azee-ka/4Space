from django.apps import AppConfig

class MessagingConfig(AppConfig):
    name = 'src.messaging'
    verbose_name = 'Messaging'

    def ready(self):
        # Import the signal handlers so they get registered.
        import src.messaging.signals
