import sys
from pathlib import Path
import os
import django

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
django.setup()

from django.test import Client
from rest_framework.authtoken.models import Token

tokens = list(Token.objects.values_list('key', flat=True))
if not tokens:
    print('NO_TOKEN')
    sys.exit(1)

token = tokens[0]
client = Client(HTTP_AUTHORIZATION=f'Token {token}')
resp = client.get('/api/admin/dashboard/')
print('STATUS', resp.status_code)
try:
    print(resp.content.decode())
except Exception:
    print(resp.content)
