# community/permissions_defaults.py

DEFAULT_ADMIN_PERMISSIONS = {
    "can_add_tabs": True,
    "can_edit_tabs": True,
    "can_delete_posts": True,
    "can_moderate_comments": True,
    "can_invite_members": True,
    "can_post_discussions": True,
    "can_manage_settings": True,
}

DEFAULT_MEMBER_PERMISSIONS = {
    "can_post_discussions": True,
    "can_invite_members": False,
    "can_add_tabs": False,
    "can_edit_tabs": False,
    "can_delete_posts": False,
    "can_moderate_comments": False,
    "can_manage_settings": False,
}