from django.contrib import admin

# Register your models here.
from .models import LogEntry
admin.site.register(LogEntry)