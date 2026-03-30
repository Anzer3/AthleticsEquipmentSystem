from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0013_alter_equipment_athlete_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipment',
            name='athlete_numbers',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
