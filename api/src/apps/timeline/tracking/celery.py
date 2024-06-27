# In your celery.py or similar configuration file

from celery import Celery
from celery.schedules import crontab

app = Celery('your_project_name')

app.conf.beat_schedule = {
    'extract-features-every-hour': {
        'task': 'tracking.extraction.extract_features',
        'schedule': crontab(minute=0, hour='*'),  # Adjust the schedule as needed
    },
}

app.conf.timezone = 'UTC'
