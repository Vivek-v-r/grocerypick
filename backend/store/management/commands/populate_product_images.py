import os

from django.conf import settings
from django.core.files import File
from django.core.files.storage import FileSystemStorage, default_storage
from django.core.management.base import BaseCommand
from django.db.models import Q

from store.models import Product


NAME_TO_FILE = {
    'Fresh Tomatoes': 'fresh_tomato.jpg',
    'Green Spinach': 'spinach_palak.jpg',
    'Bananas': 'banana.jpg',
    'Onions': 'onion.jpg',
    'Amul Full Cream Milk': 'amul_full_cream_milk.jpg',
    'Farm Eggs': 'farm_fresh_eggs.jpg',
    'Amul Butter': 'amul_butter.jpg',
    'Whole Wheat Bread': '100_whole_wheat_bread.jpg',
    'Britannia Biscuits': 'britannia_marie_gold.jpg',
    'Lays Chips': 'lays_classic_potato_chips.jpg',
    'Tata Tea Premium': 'tata_tea_premium.jpg',
    'Tropicana Orange Juice': 'tropicana_orange_juice.jpg',
    'Basmati Rice': 'daawat_royal_basmati_rice.jpg',
    'Toor Dal': 'toor_dal.jpg',
    'Fortune Sunflower Oil': 'fortune_sunflower_oil.jpg',
    'MDH Chaat Masala': 'mdh_chaat_masala.jpg',
    'Colgate Toothpaste': 'colgate_toothpaste.jpg',
}


def _candidate_files(product_name):
    """Return image filenames to try for a product, exact match first."""
    names = []
    mapped = NAME_TO_FILE.get(product_name)
    if mapped:
        names.append(mapped)
    normalized = product_name.lower().replace(' ', '_').replace('-', '_')
    for ext in ('.jpg', '.jpeg', '.png', '.webp'):
        candidate = f'{normalized}{ext}'
        if candidate not in names:
            names.append(candidate)
    return names


class Command(BaseCommand):
    help = 'Attach bundled product images to products that do not have one yet'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite images that are already set',
        )

    def handle(self, *args, **options):
        force = options['force']
        media_products_dir = os.path.join(settings.MEDIA_ROOT, 'products')

        if force:
            queryset = Product.objects.all()
        else:
            queryset = Product.objects.filter(Q(image='') | Q(image__isnull=True))

        attached = skipped = missing = 0

        for product in queryset:
            source_path = None
            source_name = None
            for candidate in _candidate_files(product.name):
                path = os.path.join(media_products_dir, candidate)
                if os.path.exists(path):
                    source_path = path
                    source_name = candidate
                    break

            if not source_path:
                missing += 1
                continue

            try:
                if isinstance(default_storage, FileSystemStorage):
                    # File already lives in MEDIA_ROOT; just point the field at it.
                    product.image.name = f'products/{source_name}'
                    product.save(update_fields=['image'])
                else:
                    # Remote storage (e.g. Cloudinary): upload the bundled file.
                    with open(source_path, 'rb') as handle:
                        product.image.save(source_name, File(handle), save=True)
                attached += 1
            except Exception as exc:  # noqa: BLE001
                skipped += 1
                self.stderr.write(f'Failed for "{product.name}": {exc}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Images attached: {attached}, skipped: {skipped}, '
                f'no matching file: {missing}'
            )
        )
