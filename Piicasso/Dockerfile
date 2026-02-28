# Stage 1: Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
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

# Copy frontend build artifacts
# index.html goes to templates so Django can render it
COPY --from=frontend-build /app/frontend/build/index.html /app/templates/index.html
# static assets go to a place where collectstatic can find them or serve them
# We'll put them in 'static_build' and have Django collect them
COPY --from=frontend-build /app/frontend/build/static /app/static/

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Collect static files
RUN python manage.py collectstatic --noinput

# Run application
CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 backend.wsgi:application"]
