from django.urls import path
from . import views

urlpatterns = [
    path('', views.equipment_list),
    path('<uuid:uuid>/', views.equipment_detail)
]