from rest_framework import serializers
from .models import Event, Category, Location, EventStatus
from equipment.models import EquipmentType

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'uuid',
            'name',
            'gender'
            ]

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'uuid',
            'name',
            'description'
            ]
        
class EventStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventStatus
        fields = [
            'uuid',
            'display_text',
            'description'
            ]

class EventSerializer(serializers.ModelSerializer):
    compatible_equipment_type = serializers.PrimaryKeyRelatedField(
        queryset=EquipmentType.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Event
        fields = [
            'uuid',
            'name',
            'category',
            'compatible_equipment_type',
            'status',
            'start_time',
            'end_time',
            'location',
            'column',
            'assigned_equipment'
            ]
        read_only_fields = [
            'assigned_equipment',
        ]