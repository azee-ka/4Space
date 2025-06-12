import os
from dotenv import load_dotenv

load_dotenv()

# === Database Configuration ===
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
    


# === Django Secret Key ===
DJANGO_SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-secret-key')

# === Environment (dev or prod) ===
ENV = os.getenv("ENV", "dev")

# === Google OAuth ===
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# === GitHub OAuth (with dev/prod support) ===
if ENV == "prod":
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID_PROD")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET_PROD")
    FRONTEND_REDIRECT_URI = os.getenv("FRONTEND_URL_PROD") + "/oauth/callback"
    GITHUB_REDIRECT_URI = os.getenv("BACKEND_URL_PROD") + "/api/auth/github/callback/"
else:
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID_DEV")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET_DEV")
    FRONTEND_REDIRECT_URI = os.getenv("FRONTEND_URL_DEV") + "/oauth/callback"
    GITHUB_REDIRECT_URI = os.getenv("BACKEND_URL_DEV") + "/api/auth/github/callback/"



# ===  Storage Configuration ===
USE_AZURE_STORAGE = os.getenv("USE_AZURE_STORAGE", "false").lower() == "true"

if USE_AZURE_STORAGE:
    AZURE_ACCOUNT_NAME = os.getenv("AZURE_ACCOUNT_NAME")
    AZURE_ACCOUNT_KEY = os.getenv("AZURE_ACCOUNT_KEY")
    AZURE_MEDIA_CONTAINER = os.getenv("AZURE_MEDIA_CONTAINER", "media")

    AZURE_CUSTOM_DOMAIN = f"{AZURE_ACCOUNT_NAME}.blob.core.windows.net/{AZURE_MEDIA_CONTAINER}"
    MEDIA_URL = f"https://{AZURE_CUSTOM_DOMAIN}/"

else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(os.path.dirname(__file__), '..', 'media')
