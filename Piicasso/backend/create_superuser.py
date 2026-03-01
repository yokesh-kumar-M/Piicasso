import django
import os
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = "Yokesh-superuser"

if not User.objects.filter(username=username).exists():
    u = User.objects.create_superuser(username=username, email='admin@piicasso.com', password='password123')
    print(f"[{username}] created successfully! Password: password123")
else:
    u = User.objects.get(username=username)
    u.is_superuser = True
    u.is_staff = True
    u.set_password('password123')
    u.save()
    print(f"[{username}] already exists. Updated and forced to Superuser status. Password reset to: password123")
