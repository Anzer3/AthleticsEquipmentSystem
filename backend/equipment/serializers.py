from rest_framework import serializers
from .models import Equipment, EquipmentType

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'athlete_number',
            'equipment_type',
            'measured',
            'status',
            'created_at',
            'updated_at'
            ]

class EquipmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentType
        fields = [
            'uuid',
            'name',
            'description'
            ]