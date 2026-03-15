from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/measurements/', include('measurement.urls')),
    path('api/equipments/', include('equipment.urls')),
    path('api/events/', include('event.urls')),
    path('api/auth/', include('auth.urls')),
]
