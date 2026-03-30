from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.db.models import Q

from .models import Category, Event, EventStatus, Location
from .serializers import CategorySerializer, EventSerializer, EventStatusSerializer, LocationSerializer


class CategoryListView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class EventStatusListView(APIView):
    def get(self, request):
        statuses = EventStatus.objects.all()
        serializer = EventStatusSerializer(statuses, many=True)
        return Response(serializer.data)


class LocationListView(APIView):
    def get(self, request):
        locations = Location.objects.all()
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            location = serializer.save()
            return Response(LocationSerializer(location).data, status=201)
        return Response(serializer.errors, status=400)


class LocationDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Location.objects.get(uuid=uuid)
        except Location.DoesNotExist:
            return None

    def patch(self, request, uuid):
        location = self.get_object(uuid)
        if location is None:
            return Response(status=404)
        serializer = LocationSerializer(location, data=request.data, partial=True)
        if serializer.is_valid():
            location = serializer.save()
            return Response(LocationSerializer(location).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        location = self.get_object(uuid)
        if location is None:
            return Response(status=404)
        location.delete()
        return Response(status=204)


class EventListView(APIView):
    def get(self, request):
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            return Response(EventSerializer(event).data, status=201)
        return Response(serializer.errors, status=400)


class EventColumnUpdateSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    column = serializers.IntegerField(min_value=0, max_value=3)


class EventColumnUpdateView(APIView):
    def post(self, request):
        serializer = EventColumnUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        try:
            event = Event.objects.get(uuid=serializer.validated_data['uuid'])
        except Event.DoesNotExist:
            return Response({'detail': 'Event not found.'}, status=404)

        event.column = serializer.validated_data['column']
        event.save(update_fields=['column'])

        return Response({'uuid': str(event.uuid), 'column': event.column})


class EventEquipmentBoardView(APIView):
    def get_object(self, uuid):
        try:
            return Event.objects.get(uuid=uuid)
        except Event.DoesNotExist:
            return None

    def get(self, request, uuid):
        event = self.get_object(uuid)
        if event is None:
            return Response(status=404)

        from equipment.models import Equipment

        query = request.query_params.get('query', '').strip()
        category_query = Q()
        if event.category_id:
            category_query = Q(category_id=event.category_id) | Q(categories__uuid=event.category_id)

        compatible_type_id = event.compatible_equipment_type_id

        compatible_queryset = Equipment.objects.all()
        if event.category_id:
            compatible_queryset = compatible_queryset.filter(category_query)
        if compatible_type_id:
            compatible_queryset = compatible_queryset.filter(equipment_type_id=compatible_type_id)
        compatible_queryset = compatible_queryset.distinct()

        if query:
            compatible_queryset = compatible_queryset.filter(
                Q(equipment_number__icontains=query)
                | Q(athlete_number__icontains=query)
                | Q(equipment_type__name__icontains=query)
            )

        available = compatible_queryset.filter(event__isnull=True).select_related('equipment_type')
        assigned = compatible_queryset.filter(event_id=event.uuid).select_related('equipment_type')

        def to_card(item):
            return {
                'uuid': str(item.uuid),
                'equipment_number': item.equipment_number,
                'athlete_number': item.athlete_number,
                'equipment_type': item.equipment_type.name if item.equipment_type else 'Neznamy typ',
                'measured': item.measured,
            }

        return Response(
            {
                'available': [to_card(item) for item in available],
                'assigned': [to_card(item) for item in assigned],
            }
        )


class EventEquipmentAssignmentSerializer(serializers.Serializer):
    equipment = serializers.UUIDField()
    event = serializers.UUIDField(allow_null=True)


class EventEquipmentAssignmentView(APIView):
    def _is_equipment_compatible(self, event, equipment):
        if event is None or equipment is None:
            return False

        category_match = True
        if event.category_id:
            category_match = (
                equipment.category_id == event.category_id
                or equipment.categories.filter(uuid=event.category_id).exists()
            )

        compatible_type_id = event.compatible_equipment_type_id
        type_match = True
        if compatible_type_id:
            type_match = equipment.equipment_type_id == compatible_type_id

        return category_match and type_match

    def _refresh_assigned_equipment(self, event_uuid):
        if not event_uuid:
            return

        from equipment.models import Equipment

        event = Event.objects.filter(uuid=event_uuid).first()
        if event is None:
            return

        queryset = Equipment.objects.filter(event_id=event_uuid)

        if event.category_id:
            queryset = queryset.filter(
                Q(category_id=event.category_id) | Q(categories__uuid=event.category_id)
            )

        compatible_type_id = event.compatible_equipment_type_id
        if compatible_type_id:
            queryset = queryset.filter(equipment_type_id=compatible_type_id)

        count = queryset.distinct().count()
        Event.objects.filter(uuid=event_uuid).update(assigned_equipment=count)

    def post(self, request):
        payload = EventEquipmentAssignmentSerializer(data=request.data)
        if not payload.is_valid():
            return Response(payload.errors, status=400)

        from equipment.models import Equipment
        from equipment.serializers import EquipmentWriteSerializer

        equipment = Equipment.objects.filter(uuid=payload.validated_data['equipment']).first()
        if equipment is None:
            return Response({'detail': 'Equipment not found.'}, status=404)

        old_event_uuid = str(equipment.event_id) if equipment.event_id else None
        target_event_uuid = str(payload.validated_data['event']) if payload.validated_data['event'] else None

        target_event = None
        if target_event_uuid:
            target_event = Event.objects.filter(uuid=target_event_uuid).first()
            if target_event is None:
                return Response({'detail': 'Event not found.'}, status=404)

            if not self._is_equipment_compatible(target_event, equipment):
                return Response({'detail': 'Equipment is not compatible with this event.'}, status=400)

        serializer = EquipmentWriteSerializer(
            equipment,
            data={'event': target_event_uuid},
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        self._refresh_assigned_equipment(old_event_uuid)
        self._refresh_assigned_equipment(target_event_uuid)

        assigned_equipment = 0
        if target_event_uuid:
            assigned_equipment = Event.objects.get(uuid=target_event_uuid).assigned_equipment

        return Response(
            {
                'equipment': str(equipment.uuid),
                'event': target_event_uuid,
                'assigned_equipment': assigned_equipment,
            },
            status=200,
        )
    
class EventDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Event.objects.get(uuid=uuid)
        except Event.DoesNotExist:
            return None

    def get(self, request, uuid):
        event = self.get_object(uuid)
        if event is None:
            return Response(status=404)
        serializer = EventSerializer(event)
        return Response(serializer.data)

    def patch(self, request, uuid):
        event = self.get_object(uuid)
        if event is None:
            return Response(status=404)
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            event = serializer.save()
            return Response(EventSerializer(event).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        event = self.get_object(uuid)
        if event is None:
            return Response(status=404)
        event.delete()
        return Response(status=204)