# from django.apps import apps
# from django.contrib.contenttypes.models import ContentType
# from ..user.models import BaseUser
# from .models import Mention, Hashtag, ExchangeReference
# import re

# class TextParser:
#     mention_pattern = r'@(\w+)'
#     hashtag_pattern = r'#(\w+)'
#     exchange_pattern = r'x/(\w+)'

#     def parse(self, text):
#         mentions = re.findall(self.mention_pattern, text)
#         hashtags = re.findall(self.hashtag_pattern, text)
#         exchanges = re.findall(self.exchange_pattern, text)

#         return {
#             "mentions": mentions,
#             "hashtags": hashtags,
#             "exchanges": exchanges
#         }


# def parse_and_save_references(text, app_label, model_name, object_id):
#     parser = TextParser()
#     parsed_data = parser.parse(text)

#     mentions = parsed_data.get('mentions', [])
#     hashtags = parsed_data.get('hashtags', [])
#     exchanges = parsed_data.get('exchanges', [])

#     model = apps.get_model(app_label, model_name) 
#     content_type = ContentType.objects.get_for_model(model)

#     # Save mentions
#     for mention in mentions:
#         try:
#             user = BaseUser.objects.get(username=mention)
#             Mention.objects.create(user=user, content_type=content_type, object_id=object_id)
#         except BaseUser.DoesNotExist:
#             print(f"User {mention} does not exist.")

#     # Save hashtags
#     for hashtag in hashtags:
#         Hashtag.objects.get_or_create(
#             name=hashtag,
#             defaults={'content_type': content_type, 'object_id': object_id}
#         )

#     # Save exchange references
#     for exchange in exchanges:
#         ExchangeReference.objects.create(content_type=content_type, object_id=object_id, exchange_name=exchange)

#     return text


# class TextFieldMixin:
#     def parse_and_store_references(self, text, app_label, model_name, object_id):
#         parsed_text = parse_and_save_references(text, app_label, model_name, object_id)
#         return parsed_text
