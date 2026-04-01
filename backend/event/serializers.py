from rest_framework import serializers
from .models import Event, Category, Location, EventType
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
        
class EventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventType
        fields = [
            'uuid',
            'name'
            ]

class EventSerializer(serializers.ModelSerializer):
    compatible_equipment_type = serializers.PrimaryKeyRelatedField(
        queryset=EquipmentType.objects.all(),
        required=True,
        allow_null=False,
    )

    def validate_name(self, value):
        if not EventType.objects.filter(name=value).exists():
            raise serializers.ValidationError('Neplatný typ soutěže.')
        return value

    class Meta:
        model = Event
        fields = [
            'uuid',
            'name',
            'category',
            'compatible_equipment_type',
            'start_time',
            'end_time',
            'location',
            'equipment_distributed',
            'equipment_unloaded',
            'column',
            'assigned_equipment'
            ]
        read_only_fields = [
            'assigned_equipment',
            'equipment_distributed',
            'equipment_unloaded',
        ]
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'category': {'required': True, 'allow_null': False},
            'location': {'required': True, 'allow_null': False},
            'start_time': {'required': True},
            'end_time': {'required': True},
        }