#!/bin/bash
# Database Operations Script for PIIcasso (Linux/Mac)

if [ -z "$1" ]; then
    echo "Usage: ./db_ops.sh [command]"
    echo "Commands:"
    echo "  init      Run initial migrations and create superuser"
    echo "  migrate   Apply pending migrations"
    echo "  shell     Open Django shell"
    echo "  dbshell   Open PostgreSQL CLI"
    echo "  backup    Dump database to file"
    exit 1
fi

if [ "$1" == "init" ]; then
    echo "[INFO] Initializing Database..."
    docker-compose exec web python manage.py migrate
    docker-compose exec web python manage.py createsuperuser
fi

if [ "$1" == "migrate" ]; then
    echo "[INFO] Applying Migrations..."
    docker-compose exec web python manage.py makemigrations
    docker-compose exec web python manage.py migrate
fi

if [ "$1" == "shell" ]; then
    echo "[INFO] Opening Django Shell..."
    docker-compose exec web python manage.py shell
fi

if [ "$1" == "dbshell" ]; then
    echo "[INFO] Opening Database Shell..."
    docker-compose exec db psql -U piicasso_user -d piicasso_db
fi

if [ "$1" == "backup" ]; then
    echo "[INFO] Creating Backup..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    docker-compose exec db pg_dump -U piicasso_user piicasso_db > backup_$TIMESTAMP.sql
    echo "[SUCCESS] Backup saved to backup_$TIMESTAMP.sql"
fi
