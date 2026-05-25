from django.http import Http404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.products.services import get_product_by_barcode, get_product_by_id, list_products


class ProductListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = ProductSerializer(
            list_products(request.query_params.get("q", "")),
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(
            ProductSerializer(product, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProductDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, product_id: int) -> Product:
        try:
            return get_product_by_id(product_id)
        except Product.DoesNotExist as error:
            raise Http404("Product not found.") from error

    def get(self, request, product_id: int):
        product = self.get_object(product_id)
        serializer = ProductSerializer(product, context={"request": request})
        return Response(serializer.data)

    def put(self, request, product_id: int):
        product = self.get_object(product_id)
        serializer = ProductSerializer(
            product,
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, product_id: int):
        product = self.get_object(product_id)
        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, _request, product_id: int):
        product = self.get_object(product_id)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductByBarcodeView(APIView):
    def get(self, request, barcode):
        try:
            product = get_product_by_barcode(barcode)
        except Product.DoesNotExist as error:
            raise Http404("Product not found.") from error

        serializer = ProductSerializer(product, context={"request": request})
        return Response(serializer.data)
