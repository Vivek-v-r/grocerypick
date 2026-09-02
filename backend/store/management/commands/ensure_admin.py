import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a default admin superuser if none exists'

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.SUCCESS('Superuser already exists.'))
            return

        username = os.getenv('ADMIN_USERNAME', 'Vivek')
        email = os.getenv('ADMIN_EMAIL', 'vivekviv8000@gmail.com')
        password = os.getenv('ADMIN_PASSWORD', 'GroceryPick@2026')

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
        else:
            User.objects.filter(username=username).update(is_superuser=True, is_staff=True)
            self.stdout.write(self.style.SUCCESS(f'User "{username}" promoted to superuser.'))
