#!/bin/sh
celery -A backend worker -l info &
exec python -m http.server $PORT
