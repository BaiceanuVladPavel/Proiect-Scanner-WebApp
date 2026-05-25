from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from apps.inventory.models import StockMovement
from apps.products.models import Product


TEST_DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}


def make_test_image(name="product.png"):
    buffer = BytesIO()
    Image.new("RGB", (16, 16), color="navy").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@override_settings(DATABASES=TEST_DATABASES)
class InventoryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="inventory-user",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_get_product_by_barcode_returns_product(self):
        product = Product.objects.create(
            name="Scanner Item",
            barcode="111222333444",
            sku="SKU-111",
            quantity=7,
            min_quantity=3,
        )

        response = self.client.get(f"/api/products/{product.barcode}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["name"], "Scanner Item")
        self.assertEqual(response.json()["barcode"], product.barcode)
        self.assertEqual(response.json()["quantity"], 7)

    def test_get_product_by_barcode_returns_404(self):
        response = self.client.get("/api/products/missing/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json()["detail"], "Product not found.")

    def test_inventory_move_updates_product_and_creates_history(self):
        product = Product.objects.create(
            name="Move Item",
            barcode="555666777888",
            sku="SKU-555",
            quantity=10,
            min_quantity=2,
        )

        response = self.client.post(
            "/api/inventory/move/",
            {
                "barcode": product.barcode,
                "movement_type": StockMovement.MovementType.OUT,
                "quantity": 4,
            },
            format="json",
        )

        product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["product"]["quantity"], 6)
        self.assertEqual(response.json()["movement"]["movement_type"], "OUT")
        self.assertEqual(product.quantity, 6)
        self.assertEqual(StockMovement.objects.count(), 1)

    def test_inventory_move_rejects_negative_stock(self):
        product = Product.objects.create(
            name="Limited Item",
            barcode="999888777666",
            sku="SKU-999",
            quantity=1,
            min_quantity=0,
        )

        response = self.client.post(
            "/api/inventory/move/",
            {
                "barcode": product.barcode,
                "movement_type": StockMovement.MovementType.OUT,
                "quantity": 2,
            },
            format="json",
        )

        product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Stock cannot go negative.", str(response.json()))
        self.assertEqual(product.quantity, 1)
        self.assertEqual(StockMovement.objects.count(), 0)

    def test_inventory_move_supports_plus_five(self):
        product = Product.objects.create(
            name="Bulk Item",
            barcode="222333444555",
            sku="BULK-5",
            quantity=3,
            min_quantity=1,
        )

        response = self.client.post(
            "/api/inventory/move/",
            {
                "barcode": product.barcode,
                "movement_type": StockMovement.MovementType.IN,
                "quantity": 5,
            },
            format="json",
        )

        product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(product.quantity, 8)
        self.assertEqual(response.json()["movement"]["quantity"], 5)

    def test_inventory_move_supports_return(self):
        product = Product.objects.create(
            name="Returned Item",
            barcode="777111222333",
            sku="RET-1",
            quantity=2,
            min_quantity=0,
        )

        response = self.client.post(
            "/api/inventory/move/",
            {
                "barcode": product.barcode,
                "movement_type": StockMovement.MovementType.RETURN,
                "quantity": 1,
            },
            format="json",
        )

        product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(product.quantity, 3)
        self.assertEqual(response.json()["movement"]["movement_type"], "RETURN")

    def test_inventory_history_filters_by_product_movement_and_date(self):
        apple = Product.objects.create(
            name="Apple Juice",
            barcode="123450000",
            sku="AJ-1",
            quantity=10,
            min_quantity=2,
        )
        orange = Product.objects.create(
            name="Orange Soda",
            barcode="678900000",
            sku="OS-2",
            quantity=5,
            min_quantity=1,
        )
        apple_out = StockMovement.objects.create(
            product=apple,
            movement_type=StockMovement.MovementType.OUT,
            quantity=2,
        )
        StockMovement.objects.create(
            product=orange,
            movement_type=StockMovement.MovementType.IN,
            quantity=3,
        )

        response = self.client.get(
            "/api/inventory/history/",
            {
                "product": "apple",
                "movement_type": "OUT",
                "date": timezone.localtime(apple_out.timestamp).date().isoformat(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["product_name"], "Apple Juice")
        self.assertEqual(response.json()[0]["movement_type"], "OUT")
        self.assertEqual(response.json()[0]["quantity_delta"], -2)


@override_settings(DATABASES=TEST_DATABASES)
class ProductApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="product-user",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_list_products_filters_by_name_and_barcode(self):
        Product.objects.create(name="Apple Juice", barcode="12345", sku="AJ-1", quantity=4)
        Product.objects.create(name="Orange Soda", barcode="67890", sku="OS-2", quantity=8)

        response = self.client.get("/api/products/", {"q": "apple"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["name"], "Apple Juice")

    def test_create_product_with_image(self):
        response = self.client.post(
            "/api/products/",
            {
                "name": "New Product",
                "barcode": "123123123",
                "sku": "NP-1",
                "quantity": 5,
                "min_quantity": 2,
                "image": make_test_image(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["name"], "New Product")
        self.assertEqual(response.json()["sku"], "NP-1")
        self.assertIsNotNone(response.json()["image_url"])

    def test_update_product(self):
        product = Product.objects.create(
            name="Edit Me",
            barcode="888777666",
            sku="EDIT-1",
            quantity=3,
            min_quantity=1,
        )

        response = self.client.patch(
            f"/api/products/id/{product.id}/",
            {
                "name": "Edited",
                "quantity": 9,
            },
            format="json",
        )

        product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(product.name, "Edited")
        self.assertEqual(product.quantity, 9)

    def test_delete_product(self):
        product = Product.objects.create(
            name="Delete Me",
            barcode="000111222",
            sku="DEL-1",
            quantity=2,
            min_quantity=0,
        )

        response = self.client.delete(f"/api/products/id/{product.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_low_stock_report_returns_alert_products(self):
        Product.objects.create(
            name="Low One",
            barcode="100200300",
            sku="LOW-1",
            quantity=2,
            min_quantity=2,
        )
        Product.objects.create(
            name="Healthy One",
            barcode="400500600",
            sku="OK-1",
            quantity=8,
            min_quantity=2,
        )

        response = self.client.get("/api/reports/low-stock")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["name"], "Low One")
        self.assertEqual(response.json()["results"][0]["shortfall"], 0)
