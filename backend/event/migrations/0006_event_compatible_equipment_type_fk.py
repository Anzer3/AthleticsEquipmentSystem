import django.db.models.deletion
from django.db import migrations, models


def copy_m2m_to_fk(apps, schema_editor):
    Event = apps.get_model('event', 'Event')
    through_model = Event._meta.get_field('compatible_equipment_types').remote_field.through

    for event in Event.objects.all().only('uuid'):
        equipment_type_id = (
            through_model.objects
            .filter(event_id=event.pk)
            .values_list('equipmenttype_id', flat=True)
            .first()
        )
        if equipment_type_id:
            Event.objects.filter(pk=event.pk).update(compatible_equipment_type_id=equipment_type_id)


def copy_fk_to_m2m(apps, schema_editor):
    Event = apps.get_model('event', 'Event')
    through_model = Event._meta.get_field('compatible_equipment_types').remote_field.through

    for event in Event.objects.exclude(compatible_equipment_type_id=None).only('uuid', 'compatible_equipment_type_id'):
        through_model.objects.get_or_create(
            event_id=event.pk,
            equipmenttype_id=event.compatible_equipment_type_id,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0005_event_compatible_equipment_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='compatible_equipment_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='equipment.equipmenttype'),
        ),
        migrations.RunPython(copy_m2m_to_fk, reverse_code=copy_fk_to_m2m),
        migrations.RemoveField(
            model_name='event',
            name='compatible_equipment_types',
        ),
    ]
