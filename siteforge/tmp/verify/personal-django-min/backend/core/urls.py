from django.urls import path

from . import views

urlpatterns = [
    path("pages/<slug:slug>/", views.PageDetailView.as_view(), name="page-detail"),
    path("owner/login/", views.OwnerLoginView.as_view(), name="owner-login"),
    path("projects/", views.ProjectListView.as_view(), name="project-list"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project-detail"),
]