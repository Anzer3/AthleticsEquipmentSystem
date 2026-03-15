from rest_framework import serializers
from .models import Equipment, EquipmentStatus, EquipmentType


class EquipmentListSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    equipment_type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_category(self, obj):
        return obj.category.name if obj.category else 'Nezařazeno'

    def get_equipment_type(self, obj):
        return obj.equipment_type.name if obj.equipment_type else 'Neznámý typ'

    def get_status(self, obj):
        return obj.status.name if obj.status else 'Neznámý stav'

    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'athlete_number',
            'category',
            'equipment_type',
            'measured',
            'status',
            ]


class EquipmentDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    equipment_type_name = serializers.CharField(source='equipment_type.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)

    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'athlete_number',
            'category',
            'category_name',
            'equipment_type',
            'equipment_type_name',
            'measured',
            'status',
            'status_name',
            'created_at',
            'updated_at'
            ]


class EquipmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            'athlete_number',
            'category',
            'equipment_type',
            'measured',
            'status',
        ]


class EquipmentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentStatus
        fields = [
            'uuid',
            'name',
            'description',
        ]

class EquipmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentType
        fields = [
            'uuid',
            'name',
            'description'
            ]