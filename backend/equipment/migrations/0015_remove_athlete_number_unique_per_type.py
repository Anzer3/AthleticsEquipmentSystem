from django.db import migrations, models


def migrate_athlete_numbers(apps, schema_editor):
    Equipment = apps.get_model('equipment', 'Equipment')
    for equipment in Equipment.objects.all():
        if equipment.athlete_numbers:
            continue

        raw = getattr(equipment, 'athlete_number', '') or ''
        parsed = [part.strip() for part in raw.split(',') if part.strip()]
        if parsed:
            equipment.athlete_numbers = parsed
            equipment.save(update_fields=['athlete_numbers'])


class Migration(migrations.Migration):
    dependencies = [
        ('equipment', '0014_equipment_athlete_numbers'),
    ]

    operations = [
        migrations.RunPython(migrate_athlete_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='equipment',
            name='equipment_number',
            field=models.CharField(default=0, max_length=15),
        ),
        migrations.RemoveField(
            model_name='equipment',
            name='athlete_number',
        ),
        migrations.AddConstraint(
            model_name='equipment',
            constraint=models.UniqueConstraint(
                fields=('equipment_type', 'equipment_number'),
                name='unique_equipment_number_per_type',
            ),
        ),
    ]
