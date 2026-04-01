from django.contrib import admin

# Register your models here.
from .models import Category, Location, EventType, Event
admin.site.register(Category)
admin.site.register(Location)
admin.site.register(EventType)
admin.site.register(Event)