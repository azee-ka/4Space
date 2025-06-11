import os
from dotenv import load_dotenv

load_dotenv()

if os.environ.get("USE_SQLITE", "false") == "true":
    DATABASE_CONFIG = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3'),
        }
    }
else:
    DATABASE_CONFIG = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB'),
            'USER': os.environ.get('POSTGRES_USER'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
            'HOST': os.environ.get('POSTGRES_HOST'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }


DJANGO_SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-secret-key')
