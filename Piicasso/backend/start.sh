#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput || echo "Warning: Migration had issues, continuing..."

# Start Gunicorn (single container on 512MB — no Celery, use synchronous fallback)
echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 2 --worker-class gthread --max-requests 1000 --max-requests-jitter 50 backend.wsgi:application
