# Build Django Backend Interface
FROM python:3.11-slim as backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Create static folder and Collect static files for Django Admin
RUN mkdir -p /app/static && python manage.py collectstatic --noinput

# Run application with load-balanced parallel worker processes
CMD ["sh", "-c", "python manage.py migrate && gunicorn --workers 4 --threads 4 --bind 0.0.0.0:8000 backend.wsgi:application"]
