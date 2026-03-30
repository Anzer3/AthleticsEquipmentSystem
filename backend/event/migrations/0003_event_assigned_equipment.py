from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0002_event_column'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='assigned_equipment',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
