from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListView.as_view()),
    path('<uuid:uuid>/', views.EventDetailView.as_view())
] 