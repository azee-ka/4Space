def send_push_to_user(user, title: str, body: str, data: dict):
    """
    Look up any DeviceToken for `user`, then call your push‐service (FCM/APNs).
    """
    from ..messaging.models import DeviceToken
    tokens = DeviceToken.objects.filter(user=user).values_list("token", flat=True)

    if not tokens:
        return

    # Example with pyfcm (you’d have to install/configure it):
    from pyfcm import FCMNotification
    push_service = FCMNotification(api_key="YOUR_SERVER_KEY")

    push_service.notify_multiple_devices(
        registration_ids=list(tokens),
        message_title=title,
        message_body=body,
        data_message=data,
    )
