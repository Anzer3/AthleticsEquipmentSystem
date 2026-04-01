from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.db.models import Q

from .models import Category, Event, EventType, Location
from .serializers import CategorySerializer, EventSerializer, EventTypeSerializer, LocationSerializer


class CategoryListView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class EventTypeListView(APIView):
    def get(self, request):
        event_types = EventType.objects.all()
        serializer = EventTypeSerializer(event_types, many=True)
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

        if (event.equipment_distributed or event.equipment_unloaded) and serializer.validated_data['column'] != event.column:
            return Response({'detail': 'Equipment already distributed.'}, status=400)

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
                | Q(athlete_numbers__icontains=query)
                | Q(equipment_type__name__icontains=query)
            )

        available = compatible_queryset.filter(event__isnull=True).select_related('equipment_type')
        assigned = compatible_queryset.filter(event_id=event.uuid).select_related('equipment_type')

        def to_card(item):
            return {
                'uuid': str(item.uuid),
                'equipment_number': item.equipment_number,
                'athlete_numbers': item.athlete_numbers,
                'equipment_type': item.equipment_type.name if item.equipment_type else 'Neznamy typ',
                'legal': item.legal,
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
    status = serializers.CharField(required=False, allow_blank=True)


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

        from equipment.models import Equipment, EquipmentStatus
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

        status_name = payload.validated_data.get('status', '').strip()
        status_value = None
        if status_name:
            status = EquipmentStatus.objects.filter(name__iexact=status_name).first()
            if status is None:
                return Response({'detail': 'Equipment status not found.'}, status=400)
            status_value = str(status.uuid)

        update_payload = {'event': target_event_uuid}
        if status_value:
            update_payload['status'] = status_value

        serializer = EquipmentWriteSerializer(
            equipment,
            data=update_payload,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        updated_equipment = serializer.save()
        from equipment.streaming import publish_equipment_upsert
        publish_equipment_upsert(updated_equipment)

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


class EventDistributionSerializer(serializers.Serializer):
    distributed = serializers.BooleanField()


class EventDistributionView(APIView):
    def post(self, request, uuid):
        payload = EventDistributionSerializer(data=request.data)
        if not payload.is_valid():
            return Response(payload.errors, status=400)

        event = Event.objects.filter(uuid=uuid).first()
        if event is None:
            return Response({'detail': 'Event not found.'}, status=404)

        if event.location_id is None:
            return Response({'detail': 'Event location is missing.'}, status=400)

        from equipment.models import Equipment

        distributed = payload.validated_data['distributed']

        if distributed:
            Equipment.objects.filter(event_id=uuid).update(location_id=event.location_id)
        else:
            garage_id = Location.objects.filter(name__iexact='Garáž').values_list('uuid', flat=True).first()
            if garage_id is None:
                return Response({'detail': 'Garage location not found.'}, status=400)
            Equipment.objects.filter(event_id=uuid).update(location_id=garage_id)

        Event.objects.filter(uuid=uuid).update(equipment_distributed=distributed)

        from equipment.streaming import publish_equipment_bulk
        equipment_queryset = Equipment.objects.filter(event_id=uuid)
        publish_equipment_bulk(
            equipment_queryset.select_related('category', 'equipment_type', 'event', 'location', 'status')
            .prefetch_related('categories')
        )

        return Response({'uuid': str(uuid), 'equipment_distributed': distributed}, status=200)


class EventUnloadView(APIView):
    def post(self, request, uuid):
        event = Event.objects.filter(uuid=uuid).first()
        if event is None:
            return Response({'detail': 'Event not found.'}, status=404)

        from equipment.models import Equipment, EquipmentStatus

        available_status_id = EquipmentStatus.objects.filter(name__iexact='available').values_list('uuid', flat=True).first()
        in_use_status_id = EquipmentStatus.objects.filter(name__iexact='in use').values_list('uuid', flat=True).first()

        if not available_status_id or not in_use_status_id:
            return Response({'detail': 'Equipment status missing.'}, status=400)

        queryset = Equipment.objects.filter(event_id=uuid)
        equipment_ids = list(queryset.values_list('uuid', flat=True))
        queryset.filter(status_id=in_use_status_id).update(status_id=available_status_id)
        queryset.update(event=None)

        Event.objects.filter(uuid=uuid).update(assigned_equipment=0, equipment_unloaded=True)

        from equipment.streaming import publish_equipment_bulk
        if equipment_ids:
            publish_equipment_bulk(
                Equipment.objects.filter(uuid__in=equipment_ids)
                .select_related('category', 'equipment_type', 'event', 'location', 'status')
                .prefetch_related('categories')
            )

        return Response({'uuid': str(uuid), 'assigned_equipment': 0, 'equipment_unloaded': True}, status=200)


class EventClearEquipmentView(APIView):
    def post(self, request, uuid):
        event = Event.objects.filter(uuid=uuid).first()
        if event is None:
            return Response({'detail': 'Event not found.'}, status=404)

        from equipment.models import Equipment

        queryset = Equipment.objects.filter(event_id=uuid)
        equipment_ids = list(queryset.values_list('uuid', flat=True))
        queryset.update(event=None)
        Event.objects.filter(uuid=uuid).update(
            assigned_equipment=0,
            equipment_distributed=False,
            equipment_unloaded=False,
        )

        from equipment.streaming import publish_equipment_bulk
        if equipment_ids:
            publish_equipment_bulk(
                Equipment.objects.filter(uuid__in=equipment_ids)
                .select_related('category', 'equipment_type', 'event', 'location', 'status')
                .prefetch_related('categories')
            )

        return Response({'uuid': str(uuid), 'assigned_equipment': 0}, status=200)
    
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