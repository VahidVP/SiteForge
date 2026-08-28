from django.contrib import admin

from .models import Page, Project


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ["slug", "title"]
    prepopulated_fields = {"slug": ["title"]}

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]

