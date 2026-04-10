#!/bin/bash
python manage.py migrate --noinput
gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 3 --threads 2 --worker-class gthread backend.wsgi:application
