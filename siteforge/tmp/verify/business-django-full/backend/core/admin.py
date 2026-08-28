from django.contrib import admin

from .models import Page, Service


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ["slug", "title"]
    prepopulated_fields = {"slug": ["title"]}


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "order"]
