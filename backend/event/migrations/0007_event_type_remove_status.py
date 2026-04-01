import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0006_event_compatible_equipment_type_fk'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventType',
            fields=[
                ('uuid', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('name', models.CharField(max_length=60)),
            ],
        ),
        migrations.RemoveField(
            model_name='event',
            name='status',
        ),
        migrations.DeleteModel(
            name='EventStatus',
        ),
    ]
