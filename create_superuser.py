import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')
django.setup()

User = get_user_model()

if not User.objects.filter(username=os.environ.get('DJ_ADMIN_NAME')).exists():
    User.objects.create_superuser(
        username=os.environ.get('DJ_ADMIN_NAME'),
        email=os.environ.get('DJ_ADMIN_EMAIL'),
        password=os.environ.get('DJ_ADMIN_PASSWORD')
    )

