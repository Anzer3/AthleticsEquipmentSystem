from django.db import models
import uuid
from equipment.models import Equipment, EquipmentType

# properties that can be measured on equipment
class MeasuredProperty(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=100) # weight, length
    description = models.CharField(max_length=100)
    def __str__(self):
        return self.name

# used units for measuring properties
class MeasurementUnit(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    measured_property = models.ForeignKey(MeasuredProperty, on_delete=models.SET_NULL, null=True)
    unit = models.CharField(max_length=50) # g, mm
    def __str__(self):
        return f"{self.measured_property.name if self.measured_property else 'N/A'} - Unit: {self.unit}"

# measurement status
class MeasurementStatus(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50) # measured, unmeasured
    description = models.CharField(max_length=100)
    def __str__(self):
        return self.name

# overall measurement model
class Measurement(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(Equipment, on_delete=models.SET_NULL, null=True)
    status = models.ForeignKey(MeasurementStatus, on_delete=models.SET_NULL, null=True)
    measured_at = models.DateTimeField(auto_now_add=True)
    property = models.ForeignKey(MeasuredProperty, on_delete=models.SET_NULL, null=True)
    value = models.FloatField()
    unit = models.ForeignKey(MeasurementUnit, on_delete=models.SET_NULL, null=True)
    def __str__(self):
        return f"ID: {str(self.uuid)[:8]} - Equipment: {self.equipment.equipment_type.name if self.equipment else 'N/A'} - Status: {self.status.name if self.status else 'N/A'} - Measured at: {self.measured_at}"