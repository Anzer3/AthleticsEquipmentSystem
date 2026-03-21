from django.db import models
import uuid

from event.models import Category

# equipment status
class EquipmentStatus(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30) # available, unavailable, on event, given away
    description = models.TextField()
    def __str__(self):
        return self.name

# equipment type 
class EquipmentType(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    description = models.TextField()
    def __str__(self):
        return self.name

# overall equipment model
class Equipment(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_number = models.CharField(max_length=15, unique=True, null=False, default=0)
    athlete_number = models.CharField(max_length=15)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.SET_NULL, null=True)
    measured = models.BooleanField(default=False)
    status = models.ForeignKey(EquipmentStatus, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"UUID: {str(self.uuid)[:8]} - Type: {self.equipment_type.name if self.equipment_type else 'N/A'} - Status: {self.status.name if self.status else 'N/A'}"
    

class EquipmentTypeProperty(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    def __str__(self):
        return f"{self.equipment_type.name} - {self.name}"