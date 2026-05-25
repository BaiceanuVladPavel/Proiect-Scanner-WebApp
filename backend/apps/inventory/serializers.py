from rest_framework import serializers

from apps.inventory.models import StockMovement


class InventoryMoveSerializer(serializers.Serializer):
    barcode = serializers.CharField(max_length=64, trim_whitespace=True)
    movement_type = serializers.ChoiceField(choices=StockMovement.MovementType.choices)
    quantity = serializers.IntegerField(min_value=1)


class InventoryHistoryFilterSerializer(serializers.Serializer):
    product = serializers.CharField(max_length=255, required=False, allow_blank=True, trim_whitespace=True)
    movement_type = serializers.ChoiceField(
        choices=StockMovement.MovementType.choices,
        required=False,
    )
    date = serializers.DateField(required=False)


class StockMovementSerializer(serializers.ModelSerializer):
    barcode = serializers.CharField(source="product.barcode", read_only=True)
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    quantity_delta = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_sku",
            "barcode",
            "movement_type",
            "quantity",
            "quantity_delta",
            "timestamp",
        ]

    def get_quantity_delta(self, obj):
        return StockMovement.stock_delta(obj.movement_type, obj.quantity)
