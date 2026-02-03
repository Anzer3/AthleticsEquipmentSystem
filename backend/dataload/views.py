from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt

from rest_framework.response import Response
from event.models import Category, Location, EventStatus, Event

from .dummyData.EventData import eventData
from .dummyData.EquipmentData import equipentData
from .dummyData.MeasurementData import measurementData

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
def dataload(request):
    eventData()
    equipentData()
    measurementData()

    return Response(status=201)