"""
Verification script: ensures an admin user exists, obtains a token,
and checks the protected endpoints (login, dashboard, orders, settings)
through the Django test client (in-process, no network needed).
"""
import os
import sys
import django

# Ensure the backend project root (parent of this scripts/ dir) is importable
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
django.setup()


from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

U = get_user_model()
username = 'verifyadmin'
password = 'VerifyPass123'

u, _ = U.objects.get_or_create(username=username, defaults={'is_staff': True, 'is_superuser': True})
u.is_staff = True
u.is_superuser = True
u.set_password(password)
u.save()

client = APIClient()

# 1) Login reaches Django and returns a token
login_resp = client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
print('LOGIN STATUS:', login_resp.status_code)
try:
    print('LOGIN RESPONSE JSON:', login_resp.data)
except Exception:
    print('LOGIN RESPONSE RAW:', login_resp.content.decode('utf-8', 'ignore'))

print(f'POST /api/auth/login/ -> {login_resp.status_code}')
try:
    token = login_resp.data.get('token') if login_resp.status_code == 200 else None
except Exception:
    token = None
print('LOGIN token received:', bool(token))

# If login fails, print a hint: this script is failing with 400 before it reaches token creation.
if login_resp.status_code != 200:
    print('HINT: Ensure store/views.py admin_login expects JSON body and no CSRF issues are applied.')

assert login_resp.status_code == 200, 'Login did not reach Django / failed'

auth = APIClient()
auth.credentials(HTTP_AUTHORIZATION=f'Token {token}')


# 2) Protected endpoints must return 200
checks = {
    'GET /api/admin/dashboard/': ('get', '/api/admin/dashboard/'),
    'GET /api/admin/orders/':    ('get', '/api/admin/orders/'),
    'GET /api/store/settings/':  ('get', '/api/store/settings/'),
}

all_ok = True
for label, (method, url) in checks.items():
    resp = getattr(auth, method)(url)
    ok = resp.status_code == 200
    all_ok = all_ok and ok
    print(f'{label} -> {resp.status_code} {"OK" if ok else "FAIL"}')

print('ALL_ENDPOINTS_OK=' + str(all_ok))
