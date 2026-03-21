from django.urls import path
from . import views

urlpatterns = [
    path('statuses/', views.EquipmentStatusListView.as_view()),
    path('', views.EquipmentListView.as_view()),
    path('<uuid:uuid>/', views.EquipmentDetailView.as_view())
]