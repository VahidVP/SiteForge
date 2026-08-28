from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin-panel/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/admin/", include("core.admin_api")),
    path("api/auth/", include("accounts.urls")),
    path("api/products/", include("shop.urls")),
    path("api/contact/", include("contact.urls")),
    path("api/", include("shop.store_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
