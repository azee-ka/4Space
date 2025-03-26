from django.apps import AppConfig

class MessagingConfig(AppConfig):
    name = 'src.messaging'
    verbose_name = 'Messaging'

    def ready(self):
        # You can import and register any messaging-related signals here in the future
        pass
