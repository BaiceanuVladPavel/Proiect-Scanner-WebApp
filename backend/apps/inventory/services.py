from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q, QuerySet
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.inventory.models import StockMovement
from apps.products.models import Product

MAX_HISTORY_RESULTS = 40


@transaction.atomic
def move_inventory(*, barcode: str, movement_type: str, quantity: int) -> tuple[Product, StockMovement]:
    normalized_barcode = barcode.strip()

    try:
        product = Product.objects.get(barcode=normalized_barcode)
    except Product.DoesNotExist as error:
        raise NotFound("Product not found.") from error

    try:
        movement = product.apply_stock_movement(
            movement_type=movement_type,
            quantity=quantity,
        )
    except DjangoValidationError as error:
        raise ValidationError(error.message_dict if hasattr(error, "message_dict") else error.messages) from error

    product.refresh_from_db(fields=["quantity", "updated_at"])
    return product, movement


def list_inventory_history(
    *,
    product: str = "",
    movement_type: str | None = None,
    date=None,
) -> QuerySet[StockMovement]:
    queryset = StockMovement.objects.select_related("product").only(
        "id",
        "movement_type",
        "quantity",
        "timestamp",
        "product__id",
        "product__name",
        "product__sku",
        "product__barcode",
    )

    normalized_product = product.strip()
    if normalized_product:
        queryset = queryset.filter(
            Q(product__name__icontains=normalized_product)
            | Q(product__barcode__icontains=normalized_product)
            | Q(product__sku__icontains=normalized_product)
        )

    if movement_type:
        queryset = queryset.filter(movement_type=movement_type)

    if date:
        queryset = queryset.annotate(
            local_date=TruncDate("timestamp", tzinfo=timezone.get_current_timezone()),
        ).filter(local_date=date)

    return queryset[:MAX_HISTORY_RESULTS]
