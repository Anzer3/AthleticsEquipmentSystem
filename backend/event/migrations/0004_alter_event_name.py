from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0003_event_assigned_equipment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='name',
            field=models.CharField(max_length=120),
        ),
    ]
