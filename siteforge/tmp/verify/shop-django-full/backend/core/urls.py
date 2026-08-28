from django.urls import path

from . import views

urlpatterns = [
    path("pages/<slug:slug>/", views.PageDetailView.as_view(), name="page-detail"),
    path("owner/login/", views.OwnerLoginView.as_view(), name="owner-login"),
]