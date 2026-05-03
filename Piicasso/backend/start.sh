#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput || echo "Warning: Migration had issues, continuing..."

# Start Celery worker in background (Django settings handle missing Redis gracefully)
echo "Starting Celery worker (background)..."
celery -A backend worker -l info &

# Start Gunicorn
echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 2 --worker-class gthread backend.wsgi:application
