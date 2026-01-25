from rest_framework import serializers
from .models import Event, Category, Location, EventStatus

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'uuid',
            'name',
            'gender'
            ]

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'uuid',
            'name',
            'description'
            ]
        
class EventStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventStatus
        fields = [
            'uuid',
            'display_text',
            'description'
            ]

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'uuid',
            'name',
            'category',
            'status',
            'start_time',
            'end_time',
            'location'
            ]