import sys
from pathlib import Path
import os
import django
import json

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
users = list(User.objects.all().values('id', 'username', 'password', 'is_staff', 'is_superuser'))
print(json.dumps(users, indent=2))
