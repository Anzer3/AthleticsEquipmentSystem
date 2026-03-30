from rest_framework import serializers
from event.models import Category
from .models import Equipment, EquipmentStatus, EquipmentType


class EquipmentListSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    athlete_numbers = serializers.SerializerMethodField()
    equipment_type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    event = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    def _parse_athlete_numbers(self, value):
        return [part.strip() for part in (value or '').split(',') if part.strip()]

    def get_category(self, obj):
        names = [category.name for category in obj.categories.all()]
        if names:
            return ', '.join(names)
        return obj.category.name if obj.category else 'Nezařazeno'

    def get_categories(self, obj):
        names = [category.name for category in obj.categories.all()]
        if names:
            return names
        return [obj.category.name] if obj.category else []

    def get_equipment_type(self, obj):
        return obj.equipment_type.name if obj.equipment_type else 'Neznámý typ'

    def get_athlete_numbers(self, obj):
        if isinstance(obj.athlete_numbers, list) and obj.athlete_numbers:
            return [str(item).strip() for item in obj.athlete_numbers if str(item).strip()]
        return self._parse_athlete_numbers(obj.athlete_number)

    def get_status(self, obj):
        return obj.status.name if obj.status else 'Neznámý stav'

    def get_event(self, obj):
        return obj.event.name if obj.event else 'Bez soutěže'

    def get_location(self, obj):
        return obj.location.name if obj.location else 'Neznámá lokace'

    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'equipment_number',
            'athlete_number',
            'athlete_numbers',
            'category',
            'categories',
            'equipment_type',
            'measured',
            'legal',
            'status',
            'event',
            'location',
            ]


class EquipmentDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    categories = serializers.SerializerMethodField()
    category_names = serializers.SerializerMethodField()
    athlete_numbers = serializers.SerializerMethodField()
    equipment_type_name = serializers.CharField(source='equipment_type.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    def get_categories(self, obj):
        uuids = [str(category.uuid) for category in obj.categories.all()]
        if uuids:
            return uuids
        return [str(obj.category.uuid)] if obj.category else []

    def get_category_names(self, obj):
        names = [category.name for category in obj.categories.all()]
        if names:
            return names
        return [obj.category.name] if obj.category else []

    def get_athlete_numbers(self, obj):
        if isinstance(obj.athlete_numbers, list) and obj.athlete_numbers:
            return [str(item).strip() for item in obj.athlete_numbers if str(item).strip()]
        return [part.strip() for part in (obj.athlete_number or '').split(',') if part.strip()]

    class Meta:
        model = Equipment
        fields = [
            'uuid',
            'equipment_number',
            'athlete_number',
            'athlete_numbers',
            'category',
            'category_name',
            'categories',
            'category_names',
            'equipment_type',
            'equipment_type_name',
            'measured',
            'legal',
            'status',
            'status_name',
            'event',
            'event_name',
            'location',
            'location_name',
            'created_at',
            'updated_at'
            ]


class EquipmentWriteSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        required=False,
    )
    athlete_numbers = serializers.ListField(
        child=serializers.CharField(max_length=30),
        required=False,
        allow_empty=True,
    )

    STATUS_REGISTERED = 'REGISTERED'
    STATUS_AVAILABLE = 'AVAILABLE'
    STATUS_ILLEGAL = 'ILLEGAL'
    STATUS_IN_USE = 'IN USE'
    STATUS_RETURNED = 'RETURNED'

    class Meta:
        model = Equipment
        fields = [
            'equipment_number',
            'athlete_number',
            'athlete_numbers',
            'category',
            'categories',
            'equipment_type',
            'measured',
            'legal',
            'status',
            'event',
            'location',
        ]

    def _get_status(self, name):
        return EquipmentStatus.objects.filter(name__iexact=name).first()

    def _resolved_status_name(self, measured, legal, event, requested_status):
        requested_name = requested_status.name if requested_status else None

        if not measured:
            return self.STATUS_REGISTERED

        if not legal:
            if requested_name == self.STATUS_RETURNED and not event:
                return self.STATUS_RETURNED
            return self.STATUS_ILLEGAL

        if event:
            return self.STATUS_IN_USE

        if requested_name == self.STATUS_RETURNED:
            return self.STATUS_RETURNED

        return self.STATUS_AVAILABLE

    def _apply_rules(self, attrs, instance=None):
        measured = attrs.get('measured', instance.measured if instance else False)
        legal = attrs.get('legal', instance.legal if instance else False)
        event = attrs.get('event', instance.event if instance else None)
        requested_status = attrs.get('status', instance.status if instance else None)

        if not measured:
            legal = False
            event = None

        resolved_name = self._resolved_status_name(measured, legal, event, requested_status)
        resolved_status = self._get_status(resolved_name)

        attrs['measured'] = measured
        attrs['legal'] = legal
        attrs['event'] = event

        if resolved_status:
            attrs['status'] = resolved_status

        return attrs

    def validate_categories(self, value):
        if len(value) > 10:
            raise serializers.ValidationError('Náčiní může mít maximálně 10 kategorií.')
        return value

    def validate_athlete_numbers(self, value):
        cleaned = [item.strip() for item in value if item and item.strip()]
        if not cleaned:
            raise serializers.ValidationError('Musí být uveden alespoň jeden athlete_number.')
        return cleaned

    def _apply_athlete_numbers(self, validated_data):
        athlete_numbers = validated_data.pop('athlete_numbers', None)
        if athlete_numbers is not None:
            validated_data['athlete_numbers'] = athlete_numbers
            validated_data['athlete_number'] = ', '.join(athlete_numbers)
            return validated_data

        athlete_number = validated_data.get('athlete_number')
        if athlete_number is not None:
            parsed = [part.strip() for part in str(athlete_number).split(',') if part.strip()]
            validated_data['athlete_numbers'] = parsed
        return validated_data

    def create(self, validated_data):
        categories = validated_data.pop('categories', None)
        validated_data = self._apply_athlete_numbers(validated_data)
        validated_data = self._apply_rules(validated_data)
        equipment = super().create(validated_data)

        if categories is not None:
            equipment.categories.set(categories)
            if categories:
                equipment.category = categories[0]
                equipment.save(update_fields=['category'])

        return equipment

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        validated_data = self._apply_athlete_numbers(validated_data)
        validated_data = self._apply_rules(validated_data, instance=instance)
        equipment = super().update(instance, validated_data)

        if categories is not None:
            equipment.categories.set(categories)
            equipment.category = categories[0] if categories else None
            equipment.save(update_fields=['category'])

        return equipment


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