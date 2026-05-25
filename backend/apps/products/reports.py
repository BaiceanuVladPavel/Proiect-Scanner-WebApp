from django.db.models import F, IntegerField, QuerySet, Value
from django.db.models.functions import Coalesce

from apps.products.models import Product


def list_low_stock_products() -> QuerySet[Product]:
    return (
        Product.objects.only(
            "id",
            "name",
            "barcode",
            "sku",
            "quantity",
            "min_quantity",
            "image",
            "created_at",
            "updated_at",
        )
        .filter(quantity__lte=F("min_quantity"))
        .annotate(shortfall=Coalesce(F("min_quantity") - F("quantity"), Value(0), output_field=IntegerField()))
        .order_by("quantity", "name", "barcode")
    )
