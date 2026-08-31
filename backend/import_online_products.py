"""Clear existing products and import fast-moving Indian grocery items with online images.

Sources:
  - Product data: curated list of 120+ fast-moving Indian grocery items
  - Images: fetched from Open Food Facts API (free) + picsum.photos fallback

Run:
  python backend/import_online_products.py
"""

from __future__ import annotations

import io
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "groceryproject.settings")

import django
django.setup()

from django.core.files.base import ContentFile
from django.db import transaction
from store.models import Category, Product


# ──────────────────────── Categories ────────────────────────

CATEGORIES: list[tuple[str, str]] = [
    ("Fruits & Vegetables", "fruits-vegetables"),
    ("Dairy & Eggs", "dairy-eggs"),
    ("Bakery", "bakery"),
    ("Rice", "rice"),
    ("Dal & Pulses", "dal-pulses"),
    ("Atta & Flour", "atta-flour"),
    ("Cooking Oil", "cooking-oil"),
    ("Sugar & Salt", "sugar-salt"),
    ("Spices", "spices"),
    ("Tea & Coffee", "tea-coffee"),
    ("Biscuits & Snacks", "biscuits-snacks"),
    ("Beverages", "beverages"),
    ("Soaps & Detergents", "soaps-detergents"),
    ("Personal Care", "personal-care"),
    ("Instant Foods", "instant-foods"),
]

CATEGORY_ICONS = {
    "Fruits & Vegetables": "🥦",
    "Dairy & Eggs": "🥛",
    "Bakery": "🍞",
    "Rice": "🍚",
    "Dal & Pulses": "🫘",
    "Atta & Flour": "🌾",
    "Cooking Oil": "🛢️",
    "Sugar & Salt": "🧂",
    "Spices": "🌶️",
    "Tea & Coffee": "☕",
    "Biscuits & Snacks": "🍪",
    "Beverages": "🧃",
    "Soaps & Detergents": "🧼",
    "Personal Care": "🧴",
    "Instant Foods": "🍜",
}

CATEGORY_UNITS: dict[str, str] = {
    "Fruits & Vegetables": "1 kg",
    "Dairy & Eggs": "1 L",
    "Bakery": "1 pc",
    "Rice": "1 kg",
    "Dal & Pulses": "1 kg",
    "Atta & Flour": "1 kg",
    "Cooking Oil": "1 L",
    "Sugar & Salt": "1 kg",
    "Spices": "100 g",
    "Tea & Coffee": "100 g",
    "Biscuits & Snacks": "200 g",
    "Beverages": "1 L",
    "Soaps & Detergents": "1 pc",
    "Personal Care": "1 pc",
    "Instant Foods": "1 pc",
}

# ──────────────────────── Product data ────────────────────────

@dataclass
class ProductSpec:
    name: str
    category_name: str
    unit: str
    price: Decimal
    stock: int
    popular: bool = False

ALL_PRODUCTS: list[ProductSpec] = []

def _init_products():
    global ALL_PRODUCTS
    fv = "Fruits & Vegetables"
    ALL_PRODUCTS += [
        ProductSpec("Fresh Tomato", fv, "1 kg", Decimal("42"), 80, True),
        ProductSpec("Onion", fv, "1 kg", Decimal("35"), 90, True),
        ProductSpec("Potato", fv, "1 kg", Decimal("30"), 100, True),
        ProductSpec("Banana", fv, "1 dozen", Decimal("65"), 45, True),
        ProductSpec("Apple", fv, "1 kg", Decimal("220"), 25, False),
        ProductSpec("Orange", fv, "1 kg", Decimal("160"), 30, False),
        ProductSpec("Carrot", fv, "500 g", Decimal("45"), 70, False),
        ProductSpec("Spinach (Palak)", fv, "250 g", Decimal("28"), 45, False),
        ProductSpec("Cucumber", fv, "500 g", Decimal("25"), 75, False),
        ProductSpec("Mango (Alphonso)", fv, "500 g", Decimal("220"), 30, False),
        ProductSpec("Ginger", fv, "100 g", Decimal("40"), 70, False),
        ProductSpec("Garlic", fv, "100 g", Decimal("50"), 65, False),
        ProductSpec("Lemon", fv, "250 g", Decimal("30"), 50, False),
        ProductSpec("Pomegranate", fv, "1 kg", Decimal("260"), 20, False),
        ProductSpec("Coconut", fv, "1 pc", Decimal("30"), 25, False),
        ProductSpec("Capsicum", fv, "500 g", Decimal("70"), 55, False),
        ProductSpec("Cauliflower", fv, "1 pc", Decimal("55"), 60, False),
        ProductSpec("Coriander Leaves", fv, "100 g", Decimal("18"), 40, False),
        ProductSpec("Papaya", fv, "1 pc", Decimal("180"), 25, False),
        ProductSpec("Green Chilli", fv, "200 g", Decimal("20"), 60, False),
    ]

    dairy = "Dairy & Eggs"
    ALL_PRODUCTS += [
        ProductSpec("Amul Full Cream Milk", dairy, "1 L", Decimal("58"), 70, True),
        ProductSpec("Amul Taaza Milk", dairy, "500 ml", Decimal("28"), 60, True),
        ProductSpec("Amul Dahi (Yogurt)", dairy, "500 g", Decimal("55"), 35, True),
        ProductSpec("Amul Butter", dairy, "100 g", Decimal("55"), 45, False),
        ProductSpec("Amul Cheese Slices", dairy, "200 g", Decimal("160"), 30, False),
        ProductSpec("Farm Fresh Eggs", dairy, "6 pcs", Decimal("70"), 60, True),
        ProductSpec("Amul Ghee", dairy, "500 ml", Decimal("450"), 20, False),
        ProductSpec("Nandini Curd", dairy, "500 g", Decimal("60"), 30, False),
        ProductSpec("Amul Lassi", dairy, "500 ml", Decimal("85"), 20, False),
        ProductSpec("Fresh Paneer", dairy, "200 g", Decimal("95"), 25, False),
    ]

    bakery = "Bakery"
    ALL_PRODUCTS += [
        ProductSpec("Britannia White Bread", bakery, "400 g", Decimal("45"), 40, True),
        ProductSpec("Britannia Whole Wheat Bread", bakery, "400 g", Decimal("52"), 35, False),
        ProductSpec("Britannia Brown Bread", bakery, "400 g", Decimal("55"), 30, False),
        ProductSpec("Modern Bakery Buns", bakery, "6 pcs", Decimal("35"), 50, False),
        ProductSpec("Britannia Cake Rusk", bakery, "200 g", Decimal("60"), 25, False),
        ProductSpec("Britannia Fruit Cake", bakery, "500 g", Decimal("220"), 20, False),
        ProductSpec("Whole Wheat Atta Bread", bakery, "400 g", Decimal("60"), 25, False),
        ProductSpec("Soya Bread", bakery, "300 g", Decimal("95"), 20, False),
    ]

    rice = "Rice"
    ALL_PRODUCTS += [
        ProductSpec("India Gate Basmati Rice", rice, "1 kg", Decimal("125"), 45, True),
        ProductSpec("Fortune Basmati Rice", rice, "1 kg", Decimal("150"), 35, False),
        ProductSpec("Daawat Royal Basmati Rice", rice, "1 kg", Decimal("160"), 25, False),
        ProductSpec("Sona Masoori Rice", rice, "5 kg", Decimal("420"), 30, False),
        ProductSpec("Common Biryani Rice", rice, "1 kg", Decimal("95"), 50, False),
        ProductSpec("Gobindobhog Rice", rice, "1 kg", Decimal("140"), 20, False),
        ProductSpec("Pusa 1121 Rice", rice, "1 kg", Decimal("120"), 30, False),
        ProductSpec("Poha (Flattened Rice)", rice, "500 g", Decimal("55"), 60, False),
        ProductSpec("Vermicelli (Seviyan)", rice, "500 g", Decimal("95"), 35, False),
    ]

    dal = "Dal & Pulses"
    ALL_PRODUCTS += [
        ProductSpec("Toor Dal (Arhar)", dal, "1 kg", Decimal("160"), 50, True),
        ProductSpec("Masoor Dal (Red Lentil)", dal, "1 kg", Decimal("150"), 45, False),
        ProductSpec("Moong Dal (Split Green Gram)", dal, "1 kg", Decimal("170"), 40, False),
        ProductSpec("Urad Dal (Black Gram)", dal, "1 kg", Decimal("190"), 35, False),
        ProductSpec("Chana Dal (Split Chickpea)", dal, "1 kg", Decimal("155"), 45, False),
        ProductSpec("Rajma (Kidney Beans)", dal, "1 kg", Decimal("185"), 30, False),
        ProductSpec("Kabuli Chana (Chickpeas)", dal, "1 kg", Decimal("190"), 25, False),
        ProductSpec("Mixed Dal", dal, "1 kg", Decimal("170"), 25, False),
    ]

    atta = "Atta & Flour"
    ALL_PRODUCTS += [
        ProductSpec("Aashirvaad Whole Wheat Atta", atta, "5 kg", Decimal("240"), 30, True),
        ProductSpec("Fortune Chakki Fresh Atta", atta, "5 kg", Decimal("270"), 25, False),
        ProductSpec("Aashirvaad Atta", atta, "1 kg", Decimal("50"), 60, False),
        ProductSpec("Maida (Refined Flour)", atta, "1 kg", Decimal("55"), 40, False),
        ProductSpec("Besan (Chickpea Flour)", atta, "1 kg", Decimal("120"), 35, False),
        ProductSpec("Sooji Rava (Semolina)", atta, "1 kg", Decimal("60"), 50, False),
        ProductSpec("Corn Flour", atta, "500 g", Decimal("95"), 30, False),
        ProductSpec("Multigrain Atta", atta, "1 kg", Decimal("110"), 50, True),
        ProductSpec("Jowar Flour", atta, "1 kg", Decimal("130"), 25, False),
    ]

    oil = "Cooking Oil"
    ALL_PRODUCTS += [
        ProductSpec("Fortune Sunflower Oil", oil, "1 L", Decimal("185"), 55, True),
        ProductSpec("Fortune Sunflower Oil", oil, "5 L", Decimal("880"), 20, False),
        ProductSpec("Tata Sampann Refined Oil", oil, "1 L", Decimal("165"), 45, False),
        ProductSpec("Mustard Oil (Kachi Ghani)", oil, "1 L", Decimal("210"), 30, False),
        ProductSpec("Groundnut Oil", oil, "1 L", Decimal("320"), 20, False),
        ProductSpec("Olive Oil", oil, "500 ml", Decimal("650"), 15, False),
        ProductSpec("Sesame Oil (Til)", oil, "500 ml", Decimal("420"), 25, False),
    ]

    ss = "Sugar & Salt"
    ALL_PRODUCTS += [
        ProductSpec("Tata Salt (Iodized)", ss, "1 kg", Decimal("25"), 100, True),
        ProductSpec("Fortune Salt", ss, "1 kg", Decimal("27"), 70, False),
        ProductSpec("Refined Sugar", ss, "1 kg", Decimal("45"), 90, True),
        ProductSpec("Jaggery (Gur)", ss, "1 kg", Decimal("85"), 35, False),
        ProductSpec("Rock Salt (Sendha Namak)", ss, "1 kg", Decimal("55"), 30, False),
        ProductSpec("Powdered Sugar", ss, "1 kg", Decimal("55"), 70, True),
        ProductSpec("Black Salt", ss, "500 g", Decimal("20"), 80, False),
    ]

    spices = "Spices"
    ALL_PRODUCTS += [
        ProductSpec("Turmeric Powder (Haldi)", spices, "100 g", Decimal("60"), 45, False),
        ProductSpec("Red Chilli Powder", spices, "100 g", Decimal("80"), 40, False),
        ProductSpec("Coriander Powder (Dhaniya)", spices, "100 g", Decimal("65"), 40, False),
        ProductSpec("Garam Masala", spices, "100 g", Decimal("110"), 35, False),
        ProductSpec("Cumin Seeds (Jeera)", spices, "100 g", Decimal("85"), 35, False),
        ProductSpec("Mustard Seeds (Rai)", spices, "100 g", Decimal("85"), 35, False),
        ProductSpec("Cinnamon (Dalchini)", spices, "50 g", Decimal("220"), 25, False),
        ProductSpec("Cloves (Laung)", spices, "25 g", Decimal("160"), 20, False),
        ProductSpec("Bay Leaves (Tej Patta)", spices, "25 g", Decimal("130"), 25, False),
        ProductSpec("MDH Chaat Masala", spices, "100 g", Decimal("70"), 50, True),
        ProductSpec("MDH Kitchen King Masala", spices, "100 g", Decimal("95"), 35, False),
        ProductSpec("MDH Pav Bhaji Masala", spices, "100 g", Decimal("95"), 30, False),
    ]

    tc = "Tea & Coffee"
    ALL_PRODUCTS += [
        ProductSpec("Bru Instant Coffee", tc, "100 g", Decimal("195"), 40, True),
        ProductSpec("Bru Green Tea", tc, "200 g", Decimal("260"), 20, False),
        ProductSpec("Tata Tea Premium", tc, "500 g", Decimal("195"), 40, False),
        ProductSpec("Tata Tea Gold", tc, "500 g", Decimal("230"), 25, False),
        ProductSpec("Nescafe Classic", tc, "50 g", Decimal("280"), 20, False),
        ProductSpec("Nescafe Taster's Choice", tc, "100 g", Decimal("520"), 15, False),
        ProductSpec("Bru Elaichi Flavoured Tea", tc, "100 g", Decimal("210"), 25, False),
    ]

    bs = "Biscuits & Snacks"
    ALL_PRODUCTS += [
        ProductSpec("Parle-G Biscuits", bs, "130 g", Decimal("10"), 100, True),
        ProductSpec("Britannia Marie Gold", bs, "200 g", Decimal("40"), 40, False),
        ProductSpec("Parle Hide & Seek", bs, "154 g", Decimal("65"), 30, False),
        ProductSpec("Britannia Good Day Choco Cookies", bs, "120 g", Decimal("55"), 35, False),
        ProductSpec("Lay's Classic Potato Chips", bs, "52 g", Decimal("45"), 35, True),
        ProductSpec("Lay's Magic Masala", bs, "50 g", Decimal("45"), 35, True),
        ProductSpec("Kurkure Masala Munch", bs, "52 g", Decimal("45"), 30, False),
        ProductSpec("Haldiram's Bhujia", bs, "200 g", Decimal("160"), 25, False),
        ProductSpec("Sukhi Namkeen Mixture", bs, "200 g", Decimal("90"), 25, False),
    ]

    bev = "Beverages"
    ALL_PRODUCTS += [
        ProductSpec("Tropicana Orange Juice", bev, "1 L", Decimal("110"), 25, False),
        ProductSpec("Coca-Cola", bev, "750 ml", Decimal("60"), 25, False),
        ProductSpec("Bisleri Packaged Water", bev, "1 L", Decimal("25"), 80, True),
        ProductSpec("Real Fruit Juice Mix", bev, "1 L", Decimal("120"), 20, False),
        ProductSpec("Limca", bev, "750 ml", Decimal("55"), 25, False),
        ProductSpec("Maaza Mango Drink", bev, "750 ml", Decimal("75"), 25, False),
        ProductSpec("Fresh Lime Soda", bev, "500 ml", Decimal("60"), 20, False),
    ]

    sd = "Soaps & Detergents"
    ALL_PRODUCTS += [
        ProductSpec("Surf Excel Washing Powder", sd, "1 kg", Decimal("180"), 30, True),
        ProductSpec("Surf Excel Washing Powder", sd, "2 kg", Decimal("350"), 20, False),
        ProductSpec("Rin Advanced Detergent", sd, "1 kg", Decimal("200"), 25, False),
        ProductSpec("Vim Dishwash Liquid", sd, "500 ml", Decimal("160"), 25, False),
        ProductSpec("Vim Power Foam", sd, "450 ml", Decimal("140"), 20, False),
        ProductSpec("Harpic Toilet Cleaner", sd, "500 ml", Decimal("120"), 20, False),
        ProductSpec("Lizol Floor Cleaner", sd, "1 L", Decimal("240"), 20, False),
    ]

    pc = "Personal Care"
    ALL_PRODUCTS += [
        ProductSpec("Colgate Toothpaste", pc, "200 g", Decimal("110"), 40, False),
        ProductSpec("Colgate Toothpaste", pc, "75 g", Decimal("70"), 40, False),
        ProductSpec("Clinic Plus Shampoo", pc, "200 ml", Decimal("160"), 30, False),
        ProductSpec("Clinic Plus Shampoo", pc, "400 ml", Decimal("280"), 20, False),
        ProductSpec("Lux Soap", pc, "75 g", Decimal("65"), 50, False),
        ProductSpec("Dove Soap", pc, "75 g", Decimal("125"), 25, False),
        ProductSpec("Dove Handwash", pc, "250 ml", Decimal("160"), 20, False),
        ProductSpec("Colgate Mouthwash", pc, "500 ml", Decimal("240"), 15, False),
    ]

    inst = "Instant Foods"
    ALL_PRODUCTS += [
        ProductSpec("Maggi 2-Minute Noodles", inst, "75 g", Decimal("30"), 80, True),
        ProductSpec("Maggi Masala Noodles", inst, "70 g", Decimal("28"), 60, False),
        ProductSpec("Knorr Soupy Noodles", inst, "70 g", Decimal("45"), 25, False),
        ProductSpec("Top Ramen Instant Noodles", inst, "75 g", Decimal("50"), 20, False),
        ProductSpec("Aashirvaad Idli Mix", inst, "300 g", Decimal("160"), 15, False),
        ProductSpec("Aashirvaad Dosa Mix", inst, "300 g", Decimal("170"), 15, False),
        ProductSpec("Hakka Noodles", inst, "200 g", Decimal("140"), 20, False),
    ]

_init_products()


# ──────────────────────── Image fetching ────────────────────────

def fetch_image_from_openfoodfacts(product_name: str, category_name: str) -> Optional[ContentFile]:
    """Try to fetch a product image from Open Food Facts API."""
    query = product_name.replace(" (", " ").replace(")", "").split(" -")[0][:60]
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={encoded}&json=1&page_size=3&fields=product_name,image_url,image_thumb_url"
        req = urllib.request.Request(url, headers={
            "User-Agent": "GroceryPick/1.0 (product-import; contact@localhost)"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode("utf-8")
        import json
        body = json.loads(data)
        for p in body.get("products", []):
            img_url = p.get("image_url") or p.get("image_thumb_url")
            if not img_url:
                continue
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            try:
                img_req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(img_req, timeout=8) as img_resp:
                    img_data = img_resp.read()
                if len(img_data) < 500:
                    continue
                ext = Path(urllib.parse.urlparse(img_url).path).suffix or ".jpg"
                fname = f"{product_name.lower().replace(' ', '_').replace('(', '').replace(')', '')[:50]}{ext}"
                return ContentFile(img_data, name=fname)
            except Exception:
                continue
    except Exception:
        pass
    return None


def fetch_image_from_picsum(product_name: str, index: int) -> Optional[ContentFile]:
    """Fetch a placeholder food/grocery image from picsum.photos."""
    seed = index + hash(product_name) % 1000
    try:
        url = f"https://picsum.photos/seed/{seed}/400/400"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            img_data = resp.read()
        if len(img_data) < 500:
            return None
        fname = f"{product_name.lower().replace(' ', '_').replace('(', '').replace(')', '')[:50]}.jpg"
        return ContentFile(img_data, name=fname)
    except Exception:
        return None


# ──────────────────────── Main import ────────────────────────

@transaction.atomic
def clear_products():
    count, _ = Product.objects.all().delete()
    return count


def ensure_categories() -> int:
    created = 0
    for name, _ in CATEGORIES:
        icon = CATEGORY_ICONS.get(name, "🛒")
        _, was_created = Category.objects.get_or_create(name=name, defaults={"icon": icon})
        if was_created:
            created += 1
    return created


def import_products() -> tuple[int, int, int]:
    cat_map = {c.name: c for c in Category.objects.all()}
    existing_names = set(Product.objects.values_list("name", flat=True))
    created = 0
    skipped = 0
    images_fetched = 0

    print(f"\nImporting {len(ALL_PRODUCTS)} products...")

    for idx, spec in enumerate(ALL_PRODUCTS):
        if spec.name in existing_names:
            skipped += 1
            continue
        cat = cat_map.get(spec.category_name)
        if not cat:
            skipped += 1
            continue

        product = Product(
            category=cat,
            name=spec.name,
            description="",
            price=spec.price,
            unit=spec.unit,
            stock=spec.stock,
            is_active=True,
            is_popular=spec.popular,
        )

        # Try to fetch image from Open Food Facts API
        img_file = fetch_image_from_openfoodfacts(spec.name, spec.category_name)
        if img_file:
            product.image.save(img_file.name, img_file, save=False)
            images_fetched += 1
        else:
            # Fallback: use picsum placeholder
            placeholder = fetch_image_from_picsum(spec.name, idx)
            if placeholder:
                product.image.save(placeholder.name, placeholder, save=False)
                images_fetched += 1

        product.save()
        existing_names.add(spec.name)
        created += 1

        if created % 25 == 0:
            print(f"  ... {created} products created (with {images_fetched} images)")

        time.sleep(0.05)

    return created, skipped, images_fetched


def main():
    print("=" * 60)
    print("  GroceryPick - Online Product Import")
    print("=" * 60)

    step1 = ensure_categories()
    print(f"Categories created: {step1}")

    deleted = clear_products()
    print(f"Deleted {deleted} existing product(s)")

    # Limit to 15 most essential fast-moving products
    ALL_PRODUCTS[:] = [p for p in ALL_PRODUCTS if p.popular][:15]

    created, skipped, images = import_products()

    print(f"\n{'=' * 60}")
    print(f"  Products created: {created}")
    print(f"  Duplicates skipped: {skipped}")
    print(f"  Images fetched: {images}")
    total = Product.objects.filter(is_active=True).count()
    print(f"  Total active products: {total}")
    print(f"{'=' * 60}")

    print("\nSample products:")
    for p in Product.objects.filter(is_active=True).order_by("?")[:10]:
        img = "img" if p.image else "no-img"
        info = f"  {p.name:45s} Rs{str(p.price):>6s} | {p.unit:10s} | {img}"
        print(info.encode('utf-8', errors='replace').decode('utf-8'))


if __name__ == "__main__":
    main()
