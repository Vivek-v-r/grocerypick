"""Populate grocery categories and products for local testing.

Task:
- Create 15 required categories (if missing).
- Insert 120–150 realistic Indian fast-moving grocery products.
- Avoid duplicate products (by exact name).

Model notes:
- Product model has no `mrp` field. This script uses `price` as the Selling Price.
- Product images are optional; we leave image blank so frontend shows emoji placeholders.

Run:
  python backend/bulk_import_groceries.py
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
import sys
import os

# --- Django setup (works when executed from any working directory) ---
ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT
sys.path.insert(0, str(ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "groceryproject.settings")

import django  # noqa: E402

django.setup()  # noqa: E402

from store.models import Category, Product  # noqa: E402


@dataclass(frozen=True)
class ProductSpec:
    name: str
    category_name: str
    unit: str
    price: Decimal
    stock: int
    popular: bool = False


def ensure_categories() -> int:
    categories = [
        ("Rice", "🍚"),
        ("Dal & Pulses", "🫘"),
        ("Atta & Flour", "🌾"),
        ("Cooking Oil", "🛢️"),
        ("Sugar & Salt", "🧂"),
        ("Spices", "🌶️"),
        ("Tea & Coffee", "☕"),
        ("Biscuits & Snacks", "🍪"),
        ("Dairy", "🥛"),
        ("Beverages", "🧃"),
        ("Soaps & Detergents", "🧼"),
        ("Personal Care", "🧴"),
        ("Fruits & Vegetables", "🥦"),
        ("Bakery", "🍞"),
        ("Instant Foods", "🍜"),
    ]

    created = 0
    for name, icon in categories:
        _, was_created = Category.objects.get_or_create(name=name, defaults={"icon": icon})
        if was_created:
            created += 1
    return created


def seed_products() -> tuple[int, int, list[dict]]:
    # Exact-name uniqueness.
    existing = set(Product.objects.values_list("name", flat=True))

    required_specs: list[ProductSpec] = []

    # --- Fruits & Vegetables ---
    fv = "Fruits & Vegetables"
    required_specs += [
        ProductSpec("Fresh Tomato", fv, "1 kg", Decimal("42"), 80, True),
        ProductSpec("Onion", fv, "1 kg", Decimal("35"), 90, True),
        ProductSpec("Potato", fv, "1 kg", Decimal("30"), 100, True),
        ProductSpec("Green Chilli", fv, "200 g", Decimal("20"), 60, False),
        ProductSpec("Capsicum", fv, "500 g", Decimal("70"), 55, False),
        ProductSpec("Cauliflower", fv, "1 pc", Decimal("55"), 60, False),
        ProductSpec("Carrot", fv, "500 g", Decimal("45"), 70, False),
        ProductSpec("Coriander Leaves", fv, "100 g", Decimal("18"), 40, False),
        ProductSpec("Cucumber", fv, "500 g", Decimal("25"), 75, False),
        ProductSpec("Spinach (Palak)", fv, "250 g", Decimal("28"), 45, False),
        ProductSpec("Ginger", fv, "100 g", Decimal("40"), 70, False),
        ProductSpec("Garlic", fv, "100 g", Decimal("50"), 65, False),
        ProductSpec("Lemon", fv, "250 g", Decimal("30"), 50, False),
        ProductSpec("Mango (Alphonso) - seasonal", fv, "500 g", Decimal("220"), 30, False),
        ProductSpec("Banana", fv, "1 dozen", Decimal("65"), 45, True),
        ProductSpec("Apple", fv, "1 kg", Decimal("220"), 25, False),
        ProductSpec("Orange", fv, "1 kg", Decimal("160"), 30, False),
        ProductSpec("Pomegranate", fv, "1 kg", Decimal("260"), 20, False),
        ProductSpec("Coconut", fv, "6 pcs", Decimal("180"), 25, False),
        ProductSpec("Papaya", fv, "1 pc", Decimal("180"), 25, False),
    ]

    # --- Bakery ---
    bakery = "Bakery"
    required_specs += [
        ProductSpec("Britannia Bread", bakery, "400 g", Decimal("45"), 40, True),
        ProductSpec("Britannia Whole Wheat Bread", bakery, "400 g", Decimal("52"), 35, False),
        ProductSpec("Britannia Brown Bread", bakery, "400 g", Decimal("55"), 30, False),
        ProductSpec("Modern Bakery Bun", bakery, "6 pcs", Decimal("35"), 50, False),
        ProductSpec("Britannia Cake Rusk", bakery, "200 g", Decimal("60"), 25, False),
        ProductSpec("Britannia Fruit Cake", bakery, "500 g", Decimal("220"), 20, False),
        ProductSpec("Whole Wheat Atta Bread", bakery, "400 g", Decimal("60"), 25, False),
        ProductSpec("Soya Bread", bakery, "300 g", Decimal("95"), 20, False),
    ]

    # --- Dairy ---
    dairy = "Dairy"
    required_specs += [
        ProductSpec("Nandini Milk", dairy, "500 ml", Decimal("30"), 55, False),
        ProductSpec("Amul Taaza Milk", dairy, "500 ml", Decimal("28"), 60, True),
        ProductSpec("Amul Full Cream Milk", dairy, "1 litre", Decimal("58"), 70, True),
        ProductSpec("Amul Dahi", dairy, "500 g", Decimal("55"), 35, True),
        ProductSpec("Curd (Homestyle)", dairy, "500 g", Decimal("50"), 35, False),
        ProductSpec("Nandini Curd", dairy, "500 g", Decimal("60"), 30, False),
        ProductSpec("Amul Butter", dairy, "100 g", Decimal("55"), 45, False),
        ProductSpec("Amul Cheese Slice", dairy, "200 g", Decimal("160"), 30, False),
        ProductSpec("Nandini Ghee", dairy, "500 ml", Decimal("450"), 20, False),
        ProductSpec("Amul Lassi", dairy, "500 ml", Decimal("85"), 20, False),
        ProductSpec("Farm Eggs", dairy, "6 pcs", Decimal("70"), 60, True),
        ProductSpec("Nandini Butter", dairy, "100 g", Decimal("90"), 25, False),
        ProductSpec("Amul Cheese", dairy, "200 g", Decimal("210"), 25, False),
    ]

    # --- Rice ---
    rice = "Rice"
    required_specs += [
        ProductSpec("India Gate Basmati Rice", rice, "1 kg", Decimal("125"), 45, True),
        ProductSpec("Fortune Basmati Rice", rice, "1 kg", Decimal("150"), 35, False),
        ProductSpec("Daawat Royal Basmati Rice", rice, "1 kg", Decimal("160"), 25, False),
        ProductSpec("Sona Masoori Rice", rice, "5 kg", Decimal("420"), 30, False),
        ProductSpec("Common Biryani Rice", rice, "1 kg", Decimal("95"), 50, False),
        ProductSpec("Gobindobhog Rice", rice, "1 kg", Decimal("140"), 20, False),
        ProductSpec("Pusa 1121 Rice", rice, "1 kg", Decimal("120"), 30, False),
    ]

    # --- Dal & Pulses ---
    dal = "Dal & Pulses"
    required_specs += [
        ProductSpec("Toor Dal", dal, "1 kg", Decimal("160"), 50, True),
        ProductSpec("Masoor Dal", dal, "1 kg", Decimal("150"), 45, False),
        ProductSpec("Moong Dal", dal, "1 kg", Decimal("170"), 40, False),
        ProductSpec("Urad Whole", dal, "1 kg", Decimal("190"), 35, False),
        ProductSpec("Chana Dal", dal, "1 kg", Decimal("155"), 45, False),
        ProductSpec("Rajma (Whole)", dal, "1 kg", Decimal("185"), 30, False),
        ProductSpec("Chole (Chickpeas)", dal, "1 kg", Decimal("175"), 30, False),
        ProductSpec("Black Gram Whole", dal, "1 kg", Decimal("200"), 25, False),
        ProductSpec("Kabuli Chana", dal, "1 kg", Decimal("190"), 25, False),
        ProductSpec("Mixed Dal", dal, "1 kg", Decimal("170"), 25, False),
        ProductSpec("Rajma", dal, "2 kg", Decimal("350"), 20, False),
        ProductSpec("Tur Dal Split", dal, "1 kg", Decimal("165"), 40, False),
    ]

    # --- Atta & Flour ---
    atta = "Atta & Flour"
    required_specs += [
        ProductSpec("Aashirvaad Atta", atta, "5 kg", Decimal("240"), 30, True),
        ProductSpec("Aashirvaad Whole Wheat Flour", atta, "1 kg", Decimal("50"), 60, False),
        ProductSpec("Fortune Chakki Fresh Atta", atta, "5 kg", Decimal("270"), 25, False),
        ProductSpec("Maida", atta, "1 kg", Decimal("55"), 40, False),
        ProductSpec("Besan (Chickpea Flour)", atta, "1 kg", Decimal("120"), 35, False),
        ProductSpec("Sooji (Rava)", atta, "1 kg", Decimal("60"), 50, False),
        ProductSpec("Corn Flour", atta, "500 g", Decimal("95"), 30, False),
        ProductSpec("Jowar Flour", atta, "1 kg", Decimal("130"), 25, False),
        ProductSpec("Multigrain Atta", atta, "1 kg", Decimal("110"), 50, True),
        ProductSpec("Sattu Flour", atta, "500 g", Decimal("130"), 35, False),
    ]

    # --- Cooking Oil ---
    oil = "Cooking Oil"
    required_specs += [
        ProductSpec("Fortune Sunflower Oil", oil, "1 litre", Decimal("185"), 55, True),
        ProductSpec("Fortune Sunflower Oil", oil, "5 litre", Decimal("880"), 20, False),
        ProductSpec("Tata Sampann Sunflower Oil", oil, "1 litre", Decimal("175"), 40, False),
        ProductSpec("Tata Sampann Refined Oil", oil, "1 litre", Decimal("165"), 45, False),
        ProductSpec("Groundnut Oil (Kachi Ghani)", oil, "500 ml", Decimal("260"), 25, False),
        ProductSpec("Groundnut Oil (Refined)", oil, "1 litre", Decimal("320"), 20, False),
        ProductSpec("Mustard Oil", oil, "1 litre", Decimal("210"), 30, False),
        ProductSpec("Olive Oil", oil, "500 ml", Decimal("650"), 15, False),
    ]

    # --- Sugar & Salt ---
    ss = "Sugar & Salt"
    required_specs += [
        ProductSpec("Tata Salt", ss, "1 kg", Decimal("25"), 100, True),
        ProductSpec("Tata Salt", ss, "500 g", Decimal("14"), 80, False),
        ProductSpec("Fortune Salt", ss, "1 kg", Decimal("27"), 70, False),
        ProductSpec("Sugar (Refined)", ss, "1 kg", Decimal("45"), 90, True),
        ProductSpec("Sugar (Refined)", ss, "5 kg", Decimal("220"), 25, False),
        ProductSpec("Jaggery (Gur)", ss, "1 kg", Decimal("85"), 35, False),
        ProductSpec("Rock Salt", ss, "1 kg", Decimal("55"), 30, False),
        ProductSpec("Iodized Salt", ss, "500 g", Decimal("18"), 60, False),
    ]

    # --- Spices ---
    spices = "Spices"
    required_specs += [
        ProductSpec("Turmeric Powder (Haldi)", spices, "100 g", Decimal("60"), 45, False),
        ProductSpec("Red Chilli Powder", spices, "100 g", Decimal("80"), 40, False),
        ProductSpec("Coriander Powder", spices, "100 g", Decimal("65"), 40, False),
        ProductSpec("Garam Masala", spices, "100 g", Decimal("110"), 35, False),
        ProductSpec("Jeera (Cumin) Whole", spices, "100 g", Decimal("85"), 35, False),
        ProductSpec("Mustard Seeds", spices, "100 g", Decimal("85"), 35, False),
        ProductSpec("Cinnamon (Dalchini)", spices, "50 g", Decimal("220"), 25, False),
        ProductSpec("Cloves (Laung)", spices, "50 g", Decimal("320"), 20, False),
        ProductSpec("Bay Leaves (Tej Patta)", spices, "25 g", Decimal("130"), 25, False),
        ProductSpec("MDH Chaat Masala", spices, "100 g", Decimal("70"), 50, True),
        ProductSpec("MDH Kitchen King Masala", spices, "100 g", Decimal("95"), 35, False),
        ProductSpec("MDH Sambar Powder", spices, "100 g", Decimal("90"), 35, False),
        ProductSpec("MDH Pav Bhaji Masala", spices, "100 g", Decimal("95"), 30, False),
        ProductSpec("Rajma Masala", spices, "100 g", Decimal("120"), 20, False),
    ]

    # --- Tea & Coffee ---
    tc = "Tea & Coffee"
    required_specs += [
        ProductSpec("Bru Instant Coffee", tc, "100 g", Decimal("195"), 40, True),
        ProductSpec("Bru Instant Coffee", tc, "200 g", Decimal("350"), 25, False),
        ProductSpec("Bru Tea Dust", tc, "500 g", Decimal("210"), 35, True),
        ProductSpec("Tata Tea Premium", tc, "500 g", Decimal("195"), 40, False),
        ProductSpec("Bru Tea 1 kg", tc, "1 kg", Decimal("390"), 25, False),
        ProductSpec("Tata Tea Premium", tc, "1 kg", Decimal("370"), 20, False),
        ProductSpec("Bru Green Tea", tc, "200 g", Decimal("260"), 20, False),
        ProductSpec("Nescafe Classic", tc, "50 g", Decimal("280"), 20, False),
        ProductSpec("Nescafe Taster's Choice", tc, "100 g", Decimal("520"), 15, False),
        ProductSpec("Bru Elaichi Flavoured Tea", tc, "100 g", Decimal("210"), 25, False),
    ]

    # --- Biscuits & Snacks ---
    bs = "Biscuits & Snacks"
    required_specs += [
        ProductSpec("Parle-G Biscuits", bs, "130 g", Decimal("10"), 100, True),
        ProductSpec("Parle-G Gold", bs, "105 g", Decimal("25"), 60, False),
        ProductSpec("Britannia Marie Biscuits", bs, "200 g", Decimal("40"), 40, False),
        ProductSpec("Britannia Nutrichoice Cookies", bs, "150 g", Decimal("65"), 30, False),
        ProductSpec("Parle Monaco Crackers", bs, "75 g", Decimal("30"), 35, False),
        ProductSpec("Parle Hide & Seek", bs, "154 g", Decimal("65"), 30, False),
        ProductSpec("Britannia Good Day Choco Cookies", bs, "120 g", Decimal("55"), 35, False),
        ProductSpec("Hide & Seek Choco", bs, "90 g", Decimal("40"), 35, False),
        ProductSpec("Lays Classic Potato Chips", bs, "52 g", Decimal("45"), 35, True),
        ProductSpec("Lays Magic Masala", bs, "50 g", Decimal("45"), 35, True),
        ProductSpec("Kurkure Masala Chips", bs, "52 g", Decimal("45"), 30, False),
        ProductSpec("Bingo Mad Angles", bs, "55 g", Decimal("35"), 30, False),
        ProductSpec("Haldiram Bhujia", bs, "200 g", Decimal("160"), 25, False),
        ProductSpec("Sukhi Namkeen Mixture", bs, "200 g", Decimal("90"), 25, False),
    ]

    # --- Beverages ---
    bev = "Beverages"
    required_specs += [
        ProductSpec("Tropicana Orange Juice", bev, "1 litre", Decimal("110"), 25, False),
        ProductSpec("Real Fruit Juice", bev, "1 litre", Decimal("120"), 20, False),
        ProductSpec("Limca", bev, "750 ml", Decimal("55"), 25, False),
        ProductSpec("Coca-Cola", bev, "750 ml", Decimal("60"), 25, False),
        ProductSpec("Maaza", bev, "750 ml", Decimal("75"), 25, False),
        ProductSpec("Fresh Lime Soda", bev, "500 ml", Decimal("60"), 20, False),
        ProductSpec("Packaged Water", bev, "1 litre", Decimal("25"), 80, True),
        ProductSpec("Real Fruit Juice", bev, "500 ml", Decimal("70"), 45, False),
    ]

    # --- Soaps & Detergents ---
    sd = "Soaps & Detergents"
    required_specs += [
        ProductSpec("Surf Excel Washing Powder", sd, "1 kg", Decimal("180"), 30, True),
        ProductSpec("Surf Excel Washing Powder", sd, "2 kg", Decimal("350"), 20, False),
        ProductSpec("Surf Excel Bar", sd, "200 g", Decimal("140"), 25, False),
        ProductSpec("Rin Advanced Detergent", sd, "1 kg", Decimal("200"), 25, False),
        ProductSpec("Vim Dishwash Powder", sd, "250 g", Decimal("90"), 35, False),
        ProductSpec("Vim Dishwash Liquid", sd, "500 ml", Decimal("160"), 25, False),
        ProductSpec("Vim Power Foam", sd, "450 ml", Decimal("140"), 20, False),
        ProductSpec("Harpic Toilet Cleaner", sd, "500 ml", Decimal("120"), 20, False),
        ProductSpec("Lizol Floor Cleaner", sd, "1 litre", Decimal("240"), 20, False),
        ProductSpec("Surf Excel Detergent Cake", sd, "125 g", Decimal("60"), 30, False),
    ]

    # --- Personal Care ---
    pc = "Personal Care"
    required_specs += [
        ProductSpec("Colgate Toothpaste", pc, "200 g", Decimal("110"), 40, False),
        ProductSpec("Colgate Toothpaste", pc, "75 g", Decimal("70"), 40, False),
        ProductSpec("Clinic Plus Shampoo", pc, "200 ml", Decimal("160"), 30, False),
        ProductSpec("Clinic Plus Shampoo", pc, "400 ml", Decimal("280"), 20, False),
        ProductSpec("Lux Soap", pc, "75 g", Decimal("65"), 50, False),
        ProductSpec("Dove Soap", pc, "75 g", Decimal("125"), 25, False),
        ProductSpec("Clinic Plus Conditioner", pc, "200 ml", Decimal("220"), 20, False),
        ProductSpec("Colgate Mouthwash", pc, "500 ml", Decimal("240"), 15, False),
        ProductSpec("Rin Shampoo", pc, "200 ml", Decimal("180"), 15, False),
        ProductSpec("Dove Handwash", pc, "250 ml", Decimal("160"), 20, False),
    ]

    # --- Instant Foods ---
    inst = "Instant Foods"
    required_specs += [
        ProductSpec("Maggi 2-Minute Noodles", inst, "75 g", Decimal("30"), 80, True),
        ProductSpec("Maggi 2-Minute Noodles", inst, "5 pcs", Decimal("150"), 30, False),
        ProductSpec("Maggi Masala Noodles", inst, "70 g", Decimal("28"), 60, False),
        ProductSpec("Knorr Soupy Noodles", inst, "70 g", Decimal("45"), 25, False),
        ProductSpec("Kurkure Instant Noodles", inst, "70 g", Decimal("60"), 20, False),
        ProductSpec("Top Ramen", inst, "75 g", Decimal("50"), 20, False),
        ProductSpec("Aashirvaad Ready Mix Idli", inst, "300 g", Decimal("160"), 15, False),
        ProductSpec("Aashirvaad Ready Mix Dosa", inst, "300 g", Decimal("170"), 15, False),
        ProductSpec("Prasidh Idli Mix", inst, "250 g", Decimal("120"), 18, False),
        ProductSpec("Hakka Noodles", inst, "200 g", Decimal("140"), 20, False),
    ]

    # --- Ensure total 120–150 ---
    # The above list is intentionally limited; add commonly sold variants until we reach ~135.
    def add_if_needed():
        nonlocal required_specs
        # Add extra Rice/Dal/Spices/Snacks/Personal-care variants (still unique by name).
        fillers: list[ProductSpec] = []

        rice_more = [
            ProductSpec("Jeera Rice", "Rice", "1 kg", Decimal("110"), 45, False),
            ProductSpec("Biryani Masala Rice", "Rice", "1 kg", Decimal("160"), 25, False),
            ProductSpec("Poha", "Rice", "1 kg", Decimal("55"), 60, False),
            ProductSpec("Vermicelli (Seviyan)", "Rice", "500 g", Decimal("95"), 35, False),
        ]
        dal_more = [
            ProductSpec("Chana Dal (Split)", "Dal & Pulses", "1 kg", Decimal("165"), 40, False),
            ProductSpec("Urad Dal Split", "Dal & Pulses", "1 kg", Decimal("185"), 30, False),
            ProductSpec("Green Moong", "Dal & Pulses", "500 g", Decimal("160"), 45, False),
            ProductSpec("Hara Chana", "Dal & Pulses", "1 kg", Decimal("190"), 25, False),
        ]
        atta_more = [
            ProductSpec("Whole Wheat Flour (Harina)", "Atta & Flour", "5 kg", Decimal("520"), 20, False),
            ProductSpec("Sattu Flour", "Atta & Flour", "500 g", Decimal("130"), 35, False),
            ProductSpec("Corn Atta", "Atta & Flour", "1 kg", Decimal("180"), 25, False),
        ]
        oil_more = [
            ProductSpec("Refined Oil (Fortune)", "Cooking Oil", "1 litre", Decimal("170"), 40, False),
            ProductSpec("Refined Oil (Tata)", "Cooking Oil", "5 litre", Decimal("820"), 20, False),
            ProductSpec("Sesame Oil (Til)", "Cooking Oil", "500 ml", Decimal("420"), 25, False),
        ]
        ss_more = [
            ProductSpec("Powdered Sugar", "Sugar & Salt", "1 kg", Decimal("55"), 70, True),
            ProductSpec("Black Salt", "Sugar & Salt", "500 g", Decimal("20"), 80, False),
            ProductSpec("Iodized Salt", "Sugar & Salt", "1 kg", Decimal("35"), 60, False),
        ]
        spices_more = [
            ProductSpec("Baking Soda", "Spices", "200 g", Decimal("65"), 45, False),
            ProductSpec("Tandoori Masala", "Spices", "200 g", Decimal("140"), 25, False),
            ProductSpec("Pav Bhaji Masala", "Spices", "200 g", Decimal("130"), 30, False),
            ProductSpec("Chicken Curry Masala", "Spices", "100 g", Decimal("160"), 25, False),
        ]
        snacks_more = [
            ProductSpec("Parle Monaco Crackers", "Biscuits & Snacks", "100 g", Decimal("45"), 35, False),
            ProductSpec("Parle Hide & Seek", "Biscuits & Snacks", "165 g", Decimal("75"), 30, False),
            ProductSpec("Bingo Mad Angles", "Biscuits & Snacks", "65 g", Decimal("45"), 30, False),
            ProductSpec("Kurkure Masala Chips", "Biscuits & Snacks", "75 g", Decimal("55"), 30, False),
        ]
        personal_more = [
            ProductSpec("Dove Soap", "Personal Care", "125 g", Decimal("150"), 25, False),
            ProductSpec("Lux Soap", "Personal Care", "100 g", Decimal("90"), 25, False),
            ProductSpec("Clinic Plus Shampoo", "Personal Care", "650 ml", Decimal("450"), 15, False),
        ]
        inst_more = [
            ProductSpec("Maggi 2-Minute Noodles", "Instant Foods", "66 g", Decimal("26"), 90, False),
            ProductSpec("Maggi Masala Noodles", "Instant Foods", "85 g", Decimal("35"), 55, False),
            ProductSpec("Hakka Noodles", "Instant Foods", "250 g", Decimal("170"), 20, False),
        ]

        fillers = (
            rice_more + dal_more + atta_more + oil_more + ss_more + spices_more + snacks_more + personal_more + inst_more
        )

        # Add until total unique target ~135 (still deduped by name later).
        target = 135
        current_unique_proposed = len([s for s in required_specs])
        if current_unique_proposed < target:
            required_specs += fillers

    add_if_needed()

    # Dedup and insert
    to_create: list[Product] = []
    skipped = 0

    # Category.name is unique in this seed dataset (enforced by get_or_create), but
    # in_bulk requires a unique field at the ORM level; use an explicit map instead.
    cats = {c.name: c for c in Category.objects.all()}

    for s in required_specs:
        if s.name in existing:
            skipped += 1
            continue
        cat = cats.get(s.category_name)
        if not cat:
            continue
        stock = max(20, min(100, int(s.stock)))
        to_create.append(
            Product(
                category=cat,
                name=s.name,
                description="",
                price=s.price,
                unit=s.unit,
                stock=stock,
                is_active=True,
                is_popular=s.popular,
            )
        )

    if to_create:
        Product.objects.bulk_create(to_create, batch_size=200)

    created = len(to_create)

    sample_rows = (
        Product.objects.filter(is_active=True)
        .order_by("-created_at")
        .values_list("name", "category__name", "unit", "price", "stock")[:20]
    )

    sample = [
        {"name": r[0], "category": r[1], "unit": r[2], "price": str(r[3]), "stock": r[4]} for r in sample_rows
    ]

    return created, skipped, sample


def main():
    created_cats = ensure_categories()
    created_products, skipped_duplicates, sample = seed_products()

    print("\n=== GroceryPick Local Seed Report ===")
    print(f"Total categories created: {created_cats}")
    print(f"Total products created: {created_products}")
    print(f"Skipped duplicates: {skipped_duplicates}")
    print("\nSample inserted products:")
    for item in sample:
        print(
            f"- {item['name']} | {item['category']} | {item['unit']} | ₹{item['price']} | stock={item['stock']}"
        )


if __name__ == "__main__":
    main()

