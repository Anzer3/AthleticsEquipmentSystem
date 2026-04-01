from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0007_event_type_remove_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='equipment_distributed',
            field=models.BooleanField(default=False),
        ),
    ]
