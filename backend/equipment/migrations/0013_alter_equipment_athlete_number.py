from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0012_equipment_categories'),
    ]

    operations = [
        migrations.AlterField(
            model_name='equipment',
            name='athlete_number',
            field=models.CharField(max_length=120),
        ),
    ]
