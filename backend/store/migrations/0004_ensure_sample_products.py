from django.db import migrations


def create_sample_products(apps, schema_editor):
    Category = apps.get_model('store', 'Category')
    Product = apps.get_model('store', 'Product')
    StoreSettings = apps.get_model('store', 'StoreSettings')

    StoreSettings.objects.get_or_create(
        pk=1,
        defaults={
            'store_name': 'GroceryPick',
            'store_address': '42, Market Road, Sector 5, New Delhi - 110001',
            'store_phone': '+91-98765-43210',
            'store_hours': '8:00 AM - 10:00 PM, All Days',
            'upi_id': 'grocerypick@paytm',
            'upi_name': 'GroceryPick Store',
        }
    )

    categories = [
        ('Fruits & Vegetables', '🥦'),
        ('Dairy & Eggs', '🥛'),
        ('Bakery', '🍞'),
        ('Beverages', '🧃'),
        ('Snacks', '🍿'),
        ('Grains & Pulses', '🌾'),
        ('Oil & Spices', '🧂'),
        ('Personal Care', '🧴'),
    ]
    cat_objs = {}
    for name, icon in categories:
        obj, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon})
        cat_objs[name] = obj

    products = [
        ('Fresh Tomatoes', 'Fruits & Vegetables', 30, '1 kg', True, 150),
        ('Green Spinach', 'Fruits & Vegetables', 20, '250 g', False, 80),
        ('Bananas', 'Fruits & Vegetables', 45, '1 dozen', True, 60),
        ('Onions', 'Fruits & Vegetables', 25, '1 kg', True, 200),
        ('Amul Full Cream Milk', 'Dairy & Eggs', 60, '1 litre', True, 100),
        ('Farm Eggs', 'Dairy & Eggs', 80, '12 pcs', True, 75),
        ('Amul Butter', 'Dairy & Eggs', 55, '100 g', False, 50),
        ('Whole Wheat Bread', 'Bakery', 40, '400 g', True, 40),
        ('Britannia Biscuits', 'Snacks', 35, '200 g', True, 120),
        ('Lays Chips', 'Snacks', 20, '26 g', True, 200),
        ('Tata Tea Premium', 'Beverages', 175, '500 g', True, 60),
        ('Tropicana Orange Juice', 'Beverages', 99, '1 litre', False, 45),
        ('Basmati Rice', 'Grains & Pulses', 120, '1 kg', True, 90),
        ('Toor Dal', 'Grains & Pulses', 140, '1 kg', True, 70),
        ('Fortune Sunflower Oil', 'Oil & Spices', 180, '1 litre', True, 55),
        ('MDH Chaat Masala', 'Oil & Spices', 45, '100 g', False, 80),
        ('Colgate Toothpaste', 'Personal Care', 65, '200 g', False, 60),
        ('Dove Soap', 'Personal Care', 48, '75 g', False, 90),
    ]

    for name, category_name, price, unit, popular, stock in products:
        Product.objects.get_or_create(
            name=name,
            defaults={
                'category': cat_objs[category_name],
                'price': price,
                'unit': unit,
                'is_popular': popular,
                'stock': stock,
                'is_active': True,
            }
        )


class Migration(migrations.Migration):
    dependencies = [
        ('store', '0003_create_admin_user'),
    ]

    operations = [
        migrations.RunPython(create_sample_products, migrations.RunPython.noop),
    ]
