import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
username = 'TESTADMIN'
password = 'Test1234!'
user, created = User.objects.get_or_create(username=username, defaults={'is_staff': True, 'is_superuser': True})
if created:
    user.set_password(password)
    user.save()
else:
    user.set_password(password)
    user.save()

client = APIClient()
resp = client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
print('status', resp.status_code)
print(resp.content.decode())
