#!/bin/bash
python manage.py migrate --noinput

# Start Celery worker in the background
echo "Starting Celery worker..."
celery -A backend worker -l info &

# Start Gunicorn
echo "Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 3 --threads 2 --worker-class gthread backend.wsgi:application
