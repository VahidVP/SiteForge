from django.urls import path

from . import views

urlpatterns = [
    path("pages/<slug:slug>/", views.PageDetailView.as_view(), name="page-detail"),
    path("owner/login/", views.OwnerLoginView.as_view(), name="owner-login"),
    path("services/", views.ServiceListView.as_view(), name="service-list"),
    path("services/<int:pk>/", views.ServiceDetailView.as_view(), name="service-detail"),
]