from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='column',
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]
