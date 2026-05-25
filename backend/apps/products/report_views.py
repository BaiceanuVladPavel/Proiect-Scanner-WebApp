from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.report_serializers import LowStockProductSerializer
from apps.products.reports import list_low_stock_products


class LowStockReportView(APIView):
    def get(self, request):
        products = list_low_stock_products()
        serializer = LowStockProductSerializer(products, many=True, context={"request": request})
        return Response(
            {
                "count": len(serializer.data),
                "results": serializer.data,
            }
        )
