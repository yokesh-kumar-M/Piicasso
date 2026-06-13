#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput || echo "Warning: Migration had issues, continuing..."

# Ensure the database cache table exists. It is used as the shared cache
# fallback when REDIS_URL is not set (see settings.py CACHES), which keeps
# throttling / login-lockout correct across Gunicorn workers. Idempotent.
python manage.py createcachetable || echo "Warning: createcachetable skipped."

# Start Gunicorn (single container on 512MB — no Celery, use synchronous fallback)
echo "Starting Gunicorn server..."
exec gunicorn \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 2 \
  --threads 2 \
  --worker-class gthread \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 50 \
  backend.wsgi:application
