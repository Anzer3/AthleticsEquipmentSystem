from django.urls import path
from . import views

urlpatterns = [
    path('statuses/', views.equipment_status_list),
    path('', views.equipment_list),
    path('<uuid:uuid>/', views.equipment_detail)
]