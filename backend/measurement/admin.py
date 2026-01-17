from django.contrib import admin

# Register your models here.
from .models import MeasuredProperty, MeasurementUnit, MeasurementStatus, Measurement
admin.site.register(MeasuredProperty)
admin.site.register(MeasurementUnit)
admin.site.register(MeasurementStatus)
admin.site.register(Measurement)