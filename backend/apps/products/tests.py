from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.inventory.models import StockMovement
from apps.products.models import Product


class ProductStockMovementTests(TestCase):
    def test_apply_stock_movement_updates_quantity_and_creates_history(self):
        product = Product.objects.create(
            name="Widget A",
            barcode="1234567890123",
            sku="WIDGET-A",
            quantity=5,
            min_quantity=2,
        )

        movement = product.apply_stock_movement(StockMovement.MovementType.IN, 4)

        product.refresh_from_db()

        self.assertEqual(product.quantity, 9)
        self.assertEqual(movement.product_id, product.id)
        self.assertEqual(movement.movement_type, StockMovement.MovementType.IN)
        self.assertEqual(movement.quantity, 4)
        self.assertEqual(StockMovement.objects.count(), 1)

    def test_apply_stock_movement_blocks_negative_stock(self):
        product = Product.objects.create(
            name="Widget B",
            barcode="9876543210987",
            sku="WIDGET-B",
            quantity=1,
            min_quantity=0,
        )

        with self.assertRaises(ValidationError):
            product.apply_stock_movement(StockMovement.MovementType.OUT, 2)

        product.refresh_from_db()

        self.assertEqual(product.quantity, 1)
        self.assertEqual(StockMovement.objects.count(), 0)

    def test_clean_requires_name_and_barcode(self):
        product = Product(name=" ", barcode=" ")

        with self.assertRaises(ValidationError):
            product.clean()
