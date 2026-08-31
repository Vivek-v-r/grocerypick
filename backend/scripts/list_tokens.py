import os
import sys
from pathlib import Path
import django
import json

# ensure project root is on sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
django.setup()

from rest_framework.authtoken.models import Token

tokens = list(Token.objects.values('key', 'user_id'))
print(json.dumps(tokens, indent=2))
