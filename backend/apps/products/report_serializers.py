from rest_framework import serializers

from apps.products.models import Product


class LowStockProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    shortfall = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "barcode",
            "sku",
            "quantity",
            "min_quantity",
            "shortfall",
            "image_url",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        if request is None:
            return obj.image.url

        return request.build_absolute_uri(obj.image.url)
