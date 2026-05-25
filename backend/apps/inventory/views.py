from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inventory.serializers import (
    InventoryHistoryFilterSerializer,
    InventoryMoveSerializer,
    StockMovementSerializer,
)
from apps.inventory.services import list_inventory_history, move_inventory
from apps.products.serializers import ProductSerializer


class InventoryMoveView(APIView):
    def post(self, request):
        serializer = InventoryMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product, movement = move_inventory(**serializer.validated_data)

        return Response(
            {
                "product": ProductSerializer(product).data,
                "movement": StockMovementSerializer(movement).data,
            },
            status=status.HTTP_200_OK,
        )


class InventoryHistoryView(APIView):
    def get(self, request):
        serializer = InventoryHistoryFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        history = list_inventory_history(**serializer.validated_data)
        response_serializer = StockMovementSerializer(history, many=True)
        return Response(response_serializer.data)
