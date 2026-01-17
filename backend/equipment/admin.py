from django.contrib import admin

# Register your models here.
from .models import Equipment, EquipmentType, EquipmentStatus
admin.site.register(Equipment)
admin.site.register(EquipmentType)
admin.site.register(EquipmentStatus)