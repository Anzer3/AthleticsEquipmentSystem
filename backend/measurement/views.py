from rest_framework.views import APIView
from rest_framework.response import Response

from equipment.models import Equipment

from .models import Measurement, MeasuredProperty
from .serializers import (
    MeasuredPropertyForEquipmentSerializer,
    MeasurementDetailSerializer,
    MeasurementListSerializer,
    MeasurementWriteSerializer,
)

# ---------------------
# Measurement list
# ---------------------

class MeasurementListView(APIView):
    def get(self, request):
        measurements = Measurement.objects.all().order_by('-measured_at')
        equipment_uuid = request.query_params.get('equipment_uuid')
        if equipment_uuid:
            measurements = measurements.filter(equipment__uuid=equipment_uuid)
        serializer = MeasurementListSerializer(measurements, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MeasurementWriteSerializer(data=request.data)
        if serializer.is_valid():
            measurement = serializer.save()
            return Response(MeasurementDetailSerializer(measurement).data, status=201)
        return Response(serializer.errors, status=400)


class MeasurementPropertiesView(APIView):
    def get(self, request):
        equipment_uuid = request.query_params.get('equipment_uuid')
        if not equipment_uuid:
            return Response({"detail": "Missing query parameter: equipment_uuid"}, status=400)

        try:
            equipment = Equipment.objects.select_related('equipment_type').get(uuid=equipment_uuid)
        except Equipment.DoesNotExist:
            return Response({"detail": "Equipment not found"}, status=404)

        if not equipment.equipment_type:
            return Response({
                "equipment_uuid": str(equipment.uuid),
                "equipment_type": None,
                "properties": [],
            })

        properties = MeasuredProperty.objects.filter(equipment_type=equipment.equipment_type)
        serializer = MeasuredPropertyForEquipmentSerializer(properties, many=True)

        return Response({
            "equipment_uuid": str(equipment.uuid),
            "equipment_type": equipment.equipment_type.name,
            "properties": serializer.data,
        })

# ---------------------
# Measurement detail
# ---------------------

class MeasurementDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Measurement.objects.get(uuid=uuid)
        except Measurement.DoesNotExist:
            return None

    def get(self, request, uuid):
        measurement = self.get_object(uuid)
        if measurement is None:
            return Response(status=404)
        serializer = MeasurementDetailSerializer(measurement)
        return Response(serializer.data)

    def patch(self, request, uuid):
        measurement = self.get_object(uuid)
        if measurement is None:
            return Response(status=404)
        serializer = MeasurementWriteSerializer(measurement, data=request.data, partial=True)
        if serializer.is_valid():
            measurement = serializer.save()
            return Response(MeasurementDetailSerializer(measurement).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid):
        measurement = self.get_object(uuid)
        if measurement is None:
            return Response(status=404)
        measurement.delete()
        return Response(status=204)