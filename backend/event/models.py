from django.db import models
import uuid

# category athletes compete in
class Category(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    gender = models.SmallIntegerField(choices=[(0, 'Women'), (1, 'Men')], default=0)
    def __str__(self):
        return self.name

# location of the event
class Location(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

# type of the event
class EventType(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60)
    def __str__(self):
        return self.name

# overall event model
class Event(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    compatible_equipment_type = models.ForeignKey('equipment.EquipmentType', on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)
    equipment_distributed = models.BooleanField(default=False)
    equipment_unloaded = models.BooleanField(default=False)
    column = models.PositiveSmallIntegerField(default=0)
    assigned_equipment = models.PositiveIntegerField(default=0)
    def __str__(self):
        return self.name