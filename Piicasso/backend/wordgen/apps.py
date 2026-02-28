from django.apps import AppConfig
from django.db.models.signals import post_migrate

def seed_omega_admin(sender, **kwargs):
    from django.contrib.auth.models import User
    try:
        if not User.objects.filter(username="Yokesh-superuser").exists():
            User.objects.create_superuser("Yokesh-superuser", "omega@piicasso.admin", "password123")
            print("AUTOMATIC OMEGA CREATION SUCCESSFUL.")
    except Exception as e:
        print("Omega creation skipped or failed:", e)

class WordgenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wordgen'

    def ready(self):
        post_migrate.connect(seed_omega_admin, sender=self)
