from django.db.models import Q, QuerySet

from apps.products.models import Product

PRODUCT_ONLY_FIELDS = (
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
MAX_PRODUCT_RESULTS = 24


def get_product_by_barcode(barcode: str) -> Product:
    normalized_barcode = barcode.strip()
    return Product.objects.only(*PRODUCT_ONLY_FIELDS).get(barcode=normalized_barcode)


def get_product_by_id(product_id: int) -> Product:
    return Product.objects.only(*PRODUCT_ONLY_FIELDS).get(pk=product_id)


def list_products(search: str = "") -> QuerySet[Product]:
    queryset = Product.objects.only(*PRODUCT_ONLY_FIELDS).order_by("name", "barcode")
    normalized_search = search.strip()

    if not normalized_search:
        return queryset[:MAX_PRODUCT_RESULTS]

    if normalized_search.isdigit():
        return queryset.filter(barcode__startswith=normalized_search)[:MAX_PRODUCT_RESULTS]

    return queryset.filter(
        Q(barcode__icontains=normalized_search)
        | Q(name__icontains=normalized_search)
        | Q(sku__icontains=normalized_search)
    )[:MAX_PRODUCT_RESULTS]
