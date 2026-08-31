import sys
from pathlib import Path
import os
import django

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
users = list(User.objects.all().values('id', 'username', 'is_staff', 'is_superuser'))
tokens = list(Token.objects.values('key', 'user_id'))
import json
print('USERS:')
print(json.dumps(users, indent=2))
print('\nTOKENS:')
print(json.dumps(tokens, indent=2))
