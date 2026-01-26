from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Event
from .serializers import EventSerializer


@api_view(['GET', 'POST'])
def event_list(request):
    if request.method == 'GET':
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            return Response(EventSerializer(event).data, status=201)
        return Response(serializer.errors, status=400)
    
@api_view(['GET', 'PATCH', 'DELETE'])
def event_detail(request, uuid):
    try:
        event = Event.objects.get(uuid=uuid)
    except Event.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = EventSerializer(event)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            event = serializer.save()
            return Response(EventSerializer(event).data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        event.delete()
        return Response(status=204)