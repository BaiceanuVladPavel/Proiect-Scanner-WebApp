from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="healthcheck"),
    path("api/auth/", include("apps.auth.urls")),
    path("api/", include("apps.products.urls")),
    path("api/", include("apps.products.report_urls")),
    path("api/", include("apps.inventory.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
