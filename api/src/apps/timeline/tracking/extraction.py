# tracking/extraction.py

from celery import shared_task
from .models import UserLike, UserComment, UserShare, UserSave, PostFeatures
from ..post.models import Post

@shared_task
def extract_features():
    posts = Post.objects.all()
    for post in posts:
        like_count = UserLike.objects.filter(post=post).count()
        comment_count = UserComment.objects.filter(post=post).count()
        share_count = UserShare.objects.filter(post=post).count()
        save_count = UserSave.objects.filter(post=post).count()

        post_features, created = PostFeatures.objects.get_or_create(post=post)
        post_features.like_count = like_count
        post_features.comment_count = comment_count
        post_features.share_count = share_count
        post_features.save_count = save_count
        post_features.save()
