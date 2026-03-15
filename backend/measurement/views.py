from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Measurement
from .serializers import (
    MeasurementDetailSerializer,
    MeasurementListSerializer,
    MeasurementWriteSerializer,
)

# ---------------------
# Measurement list
# ---------------------

@api_view(['GET', 'POST'])
def measurement_list(request):
    if request.method == 'GET':
        measurements = Measurement.objects.all().order_by('-measured_at')
        serializer = MeasurementListSerializer(measurements, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MeasurementWriteSerializer(data=request.data)
        if serializer.is_valid():
            measurement = serializer.save()
            return Response(MeasurementDetailSerializer(measurement).data, status=201)
        return Response(serializer.errors, status=400)

# ---------------------
# Measurement detail
# ---------------------

@api_view(['GET', 'PATCH', 'DELETE'])
def measurement_detail(request, uuid):
    try:
        measurement = Measurement.objects.get(uuid=uuid)
    except Measurement.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = MeasurementDetailSerializer(measurement)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MeasurementWriteSerializer(measurement, data=request.data, partial=True)
        if serializer.is_valid():
            measurement = serializer.save()
            return Response(MeasurementDetailSerializer(measurement).data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        measurement.delete()
        return Response(status=204)