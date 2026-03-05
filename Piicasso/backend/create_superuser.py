"""
PIIcasso — Create Superuser from Environment Variables
========================================================
Usage:
    SUPERUSER_USERNAME=admin SUPERUSER_EMAIL=admin@piicasso.com SUPERUSER_PASSWORD=<strong-password> python create_superuser.py

SECURITY: Never hardcode passwords. Always use environment variables.
"""
import django
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

username = os.environ.get('SUPERUSER_USERNAME')
email = os.environ.get('SUPERUSER_EMAIL')
password = os.environ.get('SUPERUSER_PASSWORD')

if not all([username, email, password]):
    print("ERROR: Set SUPERUSER_USERNAME, SUPERUSER_EMAIL, and SUPERUSER_PASSWORD environment variables.")
    sys.exit(1)

try:
    validate_password(password)
except ValidationError as e:
    print(f"ERROR: Password does not meet requirements: {'; '.join(e.messages)}")
    sys.exit(1)

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created successfully.")
else:
    print(f"Superuser '{username}' already exists. No changes made.")
