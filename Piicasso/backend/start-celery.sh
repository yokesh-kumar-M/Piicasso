#!/bin/sh
# Start a dummy HTTP server in the background to satisfy Render's port binding check
# This prevents the deploy from failing when Render expects it to be a Web Service.
python -m http.server ${PORT:-10000} &

# Start the Celery worker
exec celery -A backend worker -l info
