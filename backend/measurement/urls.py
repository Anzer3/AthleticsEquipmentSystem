from django.urls import path
from . import views

urlpatterns = [
    path('', views.measurement_list),
    path('<uuid:uuid>/', views.measurement_detail)
]