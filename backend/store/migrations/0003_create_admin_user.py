from django.db import migrations


def create_admin_user(apps, schema_editor):
    # Default admin creation is disabled for security.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0002_seed_data'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, migrations.RunPython.noop),
    ]
