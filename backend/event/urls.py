from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view()),
    path('statuses/', views.EventStatusListView.as_view()),
    path('locations/', views.LocationListView.as_view()),
    path('locations/<uuid:uuid>/', views.LocationDetailView.as_view()),
    path('column/', views.EventColumnUpdateView.as_view()),
    path('equipment-assignment/', views.EventEquipmentAssignmentView.as_view()),
    path('<uuid:uuid>/equipment/', views.EventEquipmentBoardView.as_view()),
    path('', views.EventListView.as_view()),
    path('<uuid:uuid>/', views.EventDetailView.as_view())
] 