from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "featured"]
    list_editable = ["price", "featured"]
    search_fields = ["name"]
