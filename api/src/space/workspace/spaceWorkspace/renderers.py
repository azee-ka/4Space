# src/space/space/renderers.py
from rest_framework.renderers import BaseRenderer

class EventStreamRenderer(BaseRenderer):
    media_type = 'text/event-stream'
    format = 'event-stream'
    charset = None
    def render(self, data, media_type=None, renderer_context=None):
        # We’re bypassing DRF’s normal Response flow anyway,
        # so just return the raw stream bytes
        return data
