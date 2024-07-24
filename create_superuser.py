import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')
django.setup()

from django.contrib.auth.models import User

if not User.objects.filter(username=os.environ.get('DJ_ADMIN_NAME')).exists():
    User.objects.create_superuser(os.environ.get('DJ_ADMIN_NAME'), os.environ.get('DJ_ADMIN_EMAIL'), os.environ.get('DJ_ADMIN_PASSWORD'))
