import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from store.views import admin_login

User = get_user_model()
username = 'TESTADMIN'
password = 'Test1234!'
user, created = User.objects.get_or_create(username=username, defaults={'is_staff': True, 'is_superuser': True})
user.set_password(password)
user.save()

factory = APIRequestFactory()
request = factory.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
response = admin_login(request)
print(response.status_code)
print(response.data if hasattr(response, 'data') else response.content)
