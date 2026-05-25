from django.core.exceptions import ValidationError
from django.db import models


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = "IN", "In"
        OUT = "OUT", "Out"
        DAMAGED = "DAMAGED", "Damaged"
        RETURN = "RETURN", "Return"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="stock_movements",
    )
    movement_type = models.CharField(max_length=16, choices=MovementType.choices)
    quantity = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-id"]

    def __str__(self):
        return f"{self.product.barcode} {self.movement_type} {self.quantity}"

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({"quantity": "Quantity must be greater than zero."})

    @classmethod
    def stock_delta(cls, movement_type, quantity):
        if movement_type in {
            cls.MovementType.OUT,
            cls.MovementType.DAMAGED,
        }:
            return -quantity

        return quantity
