from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Category, Event
from .serializers import CategorySerializer, EventSerializer


class CategoryListView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


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