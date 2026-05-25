from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import models, transaction


class Product(models.Model):
    name = models.CharField(max_length=255, default="Unnamed product")
    barcode = models.CharField(max_length=64, unique=True, db_index=True)
    sku = models.CharField(max_length=64, unique=True, db_index=True, blank=True, default="")
    quantity = models.IntegerField(default=0)
    min_quantity = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "barcode"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["barcode"]),
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        self.barcode = self.barcode.strip()
        self.name = self.name.strip()
        self.sku = self.sku.strip()

        if not self.barcode:
            raise ValidationError({"barcode": "Barcode is required."})

        if not self.name:
            raise ValidationError({"name": "Name is required."})

    @transaction.atomic
    def apply_stock_movement(self, movement_type, quantity):
        if quantity <= 0:
            raise ValidationError("Movement quantity must be greater than zero.")

        locked_product = Product.objects.select_for_update().get(pk=self.pk)
        StockMovement = apps.get_model("inventory", "StockMovement")

        next_quantity = locked_product.quantity + StockMovement.stock_delta(
            movement_type=movement_type,
            quantity=quantity,
        )

        if next_quantity < 0:
            raise ValidationError("Stock cannot go negative.")

        locked_product.quantity = next_quantity
        locked_product.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            product=locked_product,
            movement_type=movement_type,
            quantity=quantity,
        )

        self.quantity = locked_product.quantity
        self.updated_at = locked_product.updated_at

        return movement
