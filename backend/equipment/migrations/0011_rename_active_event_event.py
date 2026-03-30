from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0010_remove_equipment_in_cart'),
    ]

    operations = [
        migrations.RenameField(
            model_name='equipment',
            old_name='active_event',
            new_name='event',
        ),
    ]
