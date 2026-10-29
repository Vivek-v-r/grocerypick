import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Ensure the admin superuser exists, using credentials from the environment'

    def handle(self, *args, **options):
        username = os.getenv('ADMIN_USERNAME', 'Vivek')
        email = os.getenv('ADMIN_EMAIL', '')
        password = os.getenv('ADMIN_PASSWORD')

        user = User.objects.filter(username=username).first()

        if not password:
            # Never fall back to a password committed to the repository.
            if user:
                user.is_superuser = True
                user.is_staff = True
                if email and user.email != email:
                    user.email = email
                user.save()
                self.stdout.write(
                    self.style.WARNING(
                        'ADMIN_PASSWORD is not set - existing admin credentials kept unchanged.'
                    )
                )
            else:
                self.stderr.write(
                    'ADMIN_PASSWORD is not set and no admin user exists. '
                    'Set ADMIN_PASSWORD in the environment.'
                )
            return

        if user:
            user.is_superuser = True
            user.is_staff = True
            if email and user.email != email:
                user.email = email
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Superuser "{username}" confirmed and password set.')
            )
        else:
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
