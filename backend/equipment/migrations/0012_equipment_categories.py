from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('equipment', '0011_rename_active_event_event'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipment',
            name='categories',
            field=models.ManyToManyField(blank=True, related_name='equipments', to='event.category'),
        ),
    ]
