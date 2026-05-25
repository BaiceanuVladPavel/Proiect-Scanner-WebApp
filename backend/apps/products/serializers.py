from rest_framework import serializers

from apps.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_path = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "barcode",
            "sku",
            "quantity",
            "min_quantity",
            "image",
            "image_path",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "image_path", "image_url"]

    def get_image_path(self, obj):
        if not obj.image:
            return None
        return obj.image.url

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        if request is None:
            return obj.image.url

        return request.build_absolute_uri(obj.image.url)

    def validate_barcode(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Barcode is required.")
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_sku(self, value):
        return value.strip()

    def validate(self, attrs):
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 0))
        min_quantity = attrs.get("min_quantity", getattr(self.instance, "min_quantity", 0))
        image = attrs.get("image")

        if quantity < 0:
            raise serializers.ValidationError({"quantity": "Quantity cannot be negative."})

        if min_quantity < 0:
            raise serializers.ValidationError({"min_quantity": "Minimum quantity cannot be negative."})

        if image is not None:
            if image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError({"image": "Image must be 5 MB or smaller."})
            if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
                raise serializers.ValidationError({"image": "Use JPEG, PNG, or WebP images."})

        return attrs
