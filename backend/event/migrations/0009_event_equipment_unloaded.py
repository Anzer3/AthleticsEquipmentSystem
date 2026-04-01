from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0008_event_equipment_distributed'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='equipment_unloaded',
            field=models.BooleanField(default=False),
        ),
    ]
