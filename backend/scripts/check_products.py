import os
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'groceryproject.settings')
import django
django.setup()
from store.models import Product
print('active_products=', Product.objects.filter(is_active=True).count())
print('total_products=', Product.objects.count())
for p in Product.objects.filter(is_active=True)[:10]:
    print(p.id, p.name, p.stock, p.is_active)
