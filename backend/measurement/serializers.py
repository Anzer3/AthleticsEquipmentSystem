from rest_framework import serializers
from .models import Measurement, MeasuredProperty, MeasurementUnit

class MeasurementListSerializer(serializers.ModelSerializer):
    measured_equipment = serializers.SerializerMethodField()
    measured_property = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = Measurement
        fields = [
            'uuid',
            'measured_equipment',
            'measured_at',
            'measured_property',
            'value',
            'unit_name',
        ]

    def get_measured_equipment(self, obj):
        if not obj.equipment:
            return '-'

        athlete_number = obj.equipment.athlete_number or '-'
        equipment_type = obj.equipment.equipment_type.name if obj.equipment.equipment_type else 'Neznámý typ'
        return f"{athlete_number} - {equipment_type}"

    def get_measured_property(self, obj):
        return obj.property.name if obj.property else '-'

    def get_unit_name(self, obj):
        return obj.unit.unit if obj.unit else '-'


class MeasurementDetailSerializer(serializers.ModelSerializer):
    measured_equipment = serializers.SerializerMethodField()
    measured_property = serializers.SerializerMethodField()
    measurement_status = serializers.SerializerMethodField()
    equipment_uuid = serializers.SerializerMethodField()
    equipment_athlete_number = serializers.SerializerMethodField()
    equipment_type = serializers.SerializerMethodField()
    equipment_category = serializers.SerializerMethodField()
    equipment_status = serializers.SerializerMethodField()
    equipment_measured = serializers.SerializerMethodField()
    property_description = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = Measurement
        fields = [
            'uuid',
            'measured_equipment',
            'measured_at',
            'measured_property',
            'value',
            'unit_name',
            'measurement_status',
            'equipment_uuid',
            'equipment_athlete_number',
            'equipment_type',
            'equipment_category',
            'equipment_status',
            'equipment_measured',
            'property_description',
        ]

    def get_measured_equipment(self, obj):
        if not obj.equipment:
            return '-'

        athlete_number = obj.equipment.athlete_number or '-'
        equipment_type = obj.equipment.equipment_type.name if obj.equipment.equipment_type else 'Neznámý typ'
        return f"{athlete_number} - {equipment_type}"

    def get_measured_property(self, obj):
        return obj.property.name if obj.property else '-'

    def get_measurement_status(self, obj):
        return obj.status.name if obj.status else '-'

    def get_equipment_uuid(self, obj):
        return obj.equipment.uuid if obj.equipment else None

    def get_equipment_athlete_number(self, obj):
        return obj.equipment.athlete_number if obj.equipment else '-'

    def get_equipment_type(self, obj):
        if not obj.equipment or not obj.equipment.equipment_type:
            return '-'
        return obj.equipment.equipment_type.name

    def get_equipment_category(self, obj):
        if not obj.equipment or not obj.equipment.category:
            return '-'
        return obj.equipment.category.name

    def get_equipment_status(self, obj):
        if not obj.equipment or not obj.equipment.status:
            return '-'
        return obj.equipment.status.name

    def get_equipment_measured(self, obj):
        if not obj.equipment:
            return None
        return obj.equipment.measured

    def get_property_description(self, obj):
        return obj.property.description if obj.property else '-'

    def get_unit_name(self, obj):
        return obj.unit.unit if obj.unit else '-'


class MeasurementWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = [
            'equipment',
            'status',
            'measured_at',
            'property',
            'value',
            'unit',
        ]


class MeasurementUnitOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementUnit
        fields = [
            'uuid',
            'unit',
        ]


class MeasuredPropertyForEquipmentSerializer(serializers.ModelSerializer):
    units = serializers.SerializerMethodField()

    class Meta:
        model = MeasuredProperty
        fields = [
            'uuid',
            'name',
            'description',
            'units',
        ]

    def get_units(self, obj):
        units = MeasurementUnit.objects.filter(measured_property=obj)
        return MeasurementUnitOptionSerializer(units, many=True).data