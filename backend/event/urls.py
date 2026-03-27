from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view()),
    path('', views.EventListView.as_view()),
    path('<uuid:uuid>/', views.EventDetailView.as_view())
] 