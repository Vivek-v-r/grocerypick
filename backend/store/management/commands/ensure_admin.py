import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Ensure a default admin superuser exists with the configured password'

    def handle(self, *args, **options):
        username = os.getenv('ADMIN_USERNAME', 'Vivek')
        email = os.getenv('ADMIN_EMAIL', 'vivekviv8000@gmail.com')
        password = os.getenv('ADMIN_PASSWORD', 'GroceryPick@2026')

        user = User.objects.filter(username=username).first()
        if user:
            user.is_superuser = True
            user.is_staff = True
            if user.email != email:
                user.email = email
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" confirmed and password reset.'))
        else:
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
