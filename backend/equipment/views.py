from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Equipment, EquipmentStatus, EquipmentType
from .serializers import (
    EquipmentDetailSerializer,
    EquipmentListSerializer,
    EquipmentStatusSerializer,
    EquipmentTypeSerializer,
    EquipmentWriteSerializer,
)

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
            return Response(EquipmentDetailSerializer(equipment).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        equipment = self.get_object(uuid)
        if equipment is None:
            return Response(status=404)
        equipment.delete()
        return Response(status=204)


class EquipmentStatusListView(APIView):
    def get(self, request):
        statuses = EquipmentStatus.objects.all()
        serializer = EquipmentStatusSerializer(statuses, many=True)
        return Response(serializer.data)
    
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