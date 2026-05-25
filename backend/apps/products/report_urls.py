from django.urls import path

from apps.products.report_views import LowStockReportView


urlpatterns = [
    path("reports/low-stock", LowStockReportView.as_view(), name="report-low-stock"),
]
