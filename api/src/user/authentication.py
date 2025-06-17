from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from .models import BaseUser

class HandleTokenAuthentication(TokenAuthentication):
    """
    Validate token on AuthUser, then swap into the active BaseUser handle.
    """
    def authenticate(self, request):
        result = super().authenticate(request)
        if not result:
            return None
        auth_user, token = result
        # find the persisted or fallback handle
        try:
            handle = auth_user.handles.get(pk=auth_user.active_handle_id)
        except BaseUser.DoesNotExist:
            handle = auth_user.handles.first()
        # keep a back‐pointer if needed
        handle._account = auth_user
        return (handle, token)

class HandleSessionAuthentication(SessionAuthentication):
    """
    Validate session on AuthUser, then swap into the active BaseUser handle.
    """
    def authenticate(self, request):
        result = super().authenticate(request)
        if not result:
            return None
        auth_user, session = result
        try:
            handle = auth_user.handles.get(pk=auth_user.active_handle_id)
        except BaseUser.DoesNotExist:
            handle = auth_user.handles.first()
        handle._account = auth_user
        return (handle, session)
