from django.contrib import admin

# Register your models here.
from .models import Category, Location, EventStatus, Event
admin.site.register(Category)
admin.site.register(Location)
admin.site.register(EventStatus)
admin.site.register(Event)