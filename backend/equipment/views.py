from django.http import StreamingHttpResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Equipment, EquipmentStatus, EquipmentType
from .serializers import (
    EquipmentDetailSerializer,
    EquipmentListSerializer,
    EquipmentReturnSerializer,
    EquipmentStatusSerializer,
    EquipmentTypeSerializer,
    EquipmentWriteSerializer,
)
from .streaming import (
    publish_equipment_delete,
    publish_equipment_upsert,
    stream_equipment,
)
from .utils import get_next_equipment_number

# ---------------------
# Equipment list
# ---------------------

class EquipmentListView(APIView):
    def get(self, request):
        equipments = Equipment.objects.all()
        serializer = EquipmentListSerializer(equipments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EquipmentWriteSerializer(data=request.data)
        if serializer.is_valid():
            equipment = serializer.save()
            publish_equipment_upsert(equipment)
            return Response(EquipmentDetailSerializer(equipment).data, status=201)
        return Response(serializer.errors, status=400)
    
# ---------------------
# Equipment detail
# ---------------------

class EquipmentDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Equipment.objects.get(uuid=uuid)
        except Equipment.DoesNotExist:
            return None

    def get(self, request, uuid):
        equipment = self.get_object(uuid)
        if equipment is None:
            return Response(status=404)
        serializer = EquipmentDetailSerializer(equipment)
        return Response(serializer.data)

    def patch(self, request, uuid):
        equipment = self.get_object(uuid)
        if equipment is None:
            return Response(status=404)
        serializer = EquipmentWriteSerializer(equipment, data=request.data, partial=True)
        if serializer.is_valid():
            equipment = serializer.save()
            publish_equipment_upsert(equipment)
            return Response(EquipmentDetailSerializer(equipment).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        equipment = self.get_object(uuid)
        if equipment is None:
            return Response(status=404)
        deleted_uuid = equipment.uuid
        equipment.delete()
        publish_equipment_delete(deleted_uuid)
        return Response(status=204)


class EquipmentStreamView(View):
    def get(self, request):
        response = StreamingHttpResponse(stream_equipment(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class EquipmentStatusListView(APIView):
    def get(self, request):
        statuses = EquipmentStatus.objects.all()
        serializer = EquipmentStatusSerializer(statuses, many=True)
        return Response(serializer.data)


class EquipmentReturnView(APIView):
    def get(self, request):
        athlete_number = request.query_params.get('athlete_number', '').strip()

        equipments = Equipment.objects.all()
        if athlete_number:
            equipments = equipments.filter(athlete_numbers__contains=[athlete_number])

        equipments = equipments.select_related('equipment_type', 'status', 'event', 'location')
        serializer = EquipmentReturnSerializer(equipments, many=True)
        return Response(serializer.data)

    def post(self, request):
        equipment_uuid = request.data.get('uuid')
        if not equipment_uuid:
            return Response({'detail': 'uuid is required.'}, status=400)

        equipment = (
            Equipment.objects.filter(uuid=equipment_uuid)
            .select_related('equipment_type', 'status', 'event', 'location')
            .first()
        )
        if equipment is None:
            return Response({'detail': 'Equipment not found.'}, status=404)

        returned_status = EquipmentStatus.objects.filter(name__iexact='returned').first()
        if returned_status is None:
            return Response({'detail': 'Returned status not found.'}, status=400)

        equipment.status = returned_status
        equipment.location = None
        equipment.save(update_fields=['status', 'location'])
        publish_equipment_upsert(equipment)

        serializer = EquipmentReturnSerializer(equipment)
        return Response(serializer.data, status=200)


class EquipmentNextNumberView(APIView):
    def get(self, request):
        equipment_type_id = request.query_params.get('equipment_type')
        if not equipment_type_id:
            return Response({'detail': 'equipment_type is required.'}, status=400)

        if not EquipmentType.objects.filter(uuid=equipment_type_id).exists():
            return Response({'detail': 'Equipment type not found.'}, status=404)

        return Response({'equipment_number': get_next_equipment_number(equipment_type_id)})
    
# ---------------------
# EquipmentType list
# ---------------------

class EquipmentTypeListView(APIView):
    def get(self, request):
        equipment_types = EquipmentType.objects.all()
        serializer = EquipmentTypeSerializer(equipment_types, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EquipmentTypeSerializer(data=request.data)
        if serializer.is_valid():
            equipment_type = serializer.save()
            return Response(EquipmentTypeSerializer(equipment_type).data, status=201)
        return Response(serializer.errors, status=400)

# ---------------------
# EquipmentType detail
# ---------------------

class EquipmentTypeDetailView(APIView):
    def get_object(self, uuid):
        try:
            return EquipmentType.objects.get(uuid=uuid)
        except EquipmentType.DoesNotExist:
            return None

    def get(self, request, uuid):
        equipment_type = self.get_object(uuid)
        if equipment_type is None:
            return Response(status=404)
        serializer = EquipmentTypeSerializer(equipment_type)
        return Response(serializer.data)

    def patch(self, request, uuid):
        equipment_type = self.get_object(uuid)
        if equipment_type is None:
            return Response(status=404)
        serializer = EquipmentTypeSerializer(equipment_type, data=request.data, partial=True)
        if serializer.is_valid():
            equipment_type = serializer.save()
            return Response(EquipmentTypeSerializer(equipment_type).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        equipment_type = self.get_object(uuid)
        if equipment_type is None:
            return Response(status=404)
        equipment_type.delete()
        return Response(status=204)