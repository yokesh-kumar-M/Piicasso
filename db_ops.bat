@echo off
REM Database Operations Script for PIIcasso (Windows)

IF "%1"=="" GOTO HELP

IF "%1"=="init" (
    echo [INFO] Initializing Database...
    docker-compose exec web python manage.py migrate
    docker-compose exec web python manage.py createsuperuser
    GOTO END
)

IF "%1"=="migrate" (
    echo [INFO] Applying Migrations...
    docker-compose exec web python manage.py makemigrations
    docker-compose exec web python manage.py migrate
    GOTO END
)

IF "%1"=="shell" (
    echo [INFO] Opening Django Shell...
    docker-compose exec web python manage.py shell
    GOTO END
)

IF "%1"=="dbshell" (
    echo [INFO] Opening Database Shell...
    docker-compose exec db psql -U piicasso_user -d piicasso_db
    GOTO END
)

IF "%1"=="backup" (
    echo [INFO] Creating Backup...
    docker-compose exec db pg_dump -U piicasso_user piicasso_db > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
    echo [SUCCESS] Backup saved to backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
    GOTO END
)

:HELP
echo Usage: db_ops.bat [command]
echo Commands:
echo   init      Run initial migrations and create superuser
echo   migrate   Apply pending migrations
echo   shell     Open Django shell
echo   dbshell   Open PostgreSQL CLI
echo   backup    Dump database to file
GOTO END

:END
