from django.db import models
import uuid

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
    athlete_number = models.IntegerField()
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.SET_NULL, null=True)
    measured = models.BooleanField(default=False)
    status = models.ForeignKey(EquipmentStatus, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"UUID: {str(self.uuid)[:8]} - Type: {self.equipment_type.name if self.equipment_type else 'N/A'} - Status: {self.status.name if self.status else 'N/A'}"