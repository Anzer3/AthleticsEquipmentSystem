from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.MeasurementPropertiesView.as_view()),
    path('', views.MeasurementListView.as_view()),
    path('<uuid:uuid>/', views.MeasurementDetailView.as_view())
]