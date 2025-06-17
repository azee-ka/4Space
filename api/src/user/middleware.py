# src/user/middleware.py
from django.utils.deprecation import MiddlewareMixin
from .models import BaseUser

class HandleSessionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_user = getattr(request, 'user', None)
        if not auth_user or not auth_user.is_authenticated:
            return

        hid    = request.session.get('active_handle')
        handle = None
        if hid:
            try:
                handle = BaseUser.objects.get(pk=hid, account=auth_user)
            except BaseUser.DoesNotExist:
                pass

        if not handle:
            handle = auth_user.active_handle

        if handle:
            handle._account = auth_user
            request.user    = handle
