#!/bin/bash
python manage.py migrate --noinput
gunicorn --bind 0.0.0.0:${PORT:-8001} user_backend.wsgi:application
