#!/bin/sh
set -eu

echo "Collecting static assets..."
python manage.py collectstatic --noinput

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Ensuring the database cache table exists..."
python manage.py createcachetable

echo "Starting Daphne ASGI server on port ${PORT:-8000}..."
exec daphne \
  --bind 0.0.0.0 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --access-log - \
  backend.asgi:application
