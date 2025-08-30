# backend/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('piicasso')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# backend/settings.py
# Celery Configuration
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'