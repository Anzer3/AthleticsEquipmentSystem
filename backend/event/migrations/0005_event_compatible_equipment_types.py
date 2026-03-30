from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0014_equipment_athlete_numbers'),
        ('event', '0004_alter_event_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='compatible_equipment_types',
            field=models.ManyToManyField(blank=True, related_name='events', to='equipment.equipmenttype'),
        ),
    ]
