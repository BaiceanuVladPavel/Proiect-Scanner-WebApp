from django.urls import path

from apps.products.views import ProductByBarcodeView, ProductDetailView, ProductListCreateView


urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<str:barcode>/", ProductByBarcodeView.as_view(), name="product-by-barcode"),
    path("products/id/<int:product_id>/", ProductDetailView.as_view(), name="product-detail"),
]
