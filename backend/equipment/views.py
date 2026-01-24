from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Equipment, EquipmentType
from .serializers import EquipmentSerializer, EquipmentTypeSerializer

# ---------------------
# Equipment list
# ---------------------

@api_view(['GET', 'POST'])
def equipment_list(request):
    if request.method == 'GET':
        equipments = Equipment.objects.all()
        serializer = EquipmentSerializer(equipments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            equipment = serializer.save()
            return Response(EquipmentSerializer(equipment).data, status=201)
        return Response(serializer.errors, status=400)
    
# ---------------------
# Equipment detail
# ---------------------

@api_view(['GET', 'PATCH', 'DELETE'])
def equipment_detail(request, uuid):
    try:
        equipment = Equipment.objects.get(uuid=uuid)
    except Equipment.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = EquipmentSerializer(equipment, data=request.data, partial=True)
        if serializer.is_valid():
            equipment = serializer.save()
            return Response(EquipmentSerializer(equipment).data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        equipment.delete()
        return Response(status=204)
    
# ---------------------
# EquipmentType list
# ---------------------

@api_view(['GET', 'POST'])
def equipment_type_list(request):
    if request.method == 'GET':
        equipment_types = EquipmentType.objects.all()
        serializer = EquipmentTypeSerializer(equipment_types, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EquipmentTypeSerializer(data=request.data)
        if serializer.is_valid():
            equipment_type = serializer.save()
            return Response(EquipmentTypeSerializer(equipment_type).data, status=201)
        return Response(serializer.errors, status=400)

# ---------------------
# EquipmentType detail
# ---------------------

@api_view(['GET', 'PATCH', 'DELETE'])
def equipment_type_detail(request, uuid):
    try:
        equipment_type = EquipmentType.objects.get(uuid=uuid)
    except EquipmentType.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = EquipmentTypeSerializer(equipment_type)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = EquipmentTypeSerializer(equipment_type, data=request.data, partial=True)
        if serializer.is_valid():
            equipment_type = serializer.save()
            return Response(EquipmentTypeSerializer(equipment_type).data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        equipment_type.delete()
        return Response(status=204)