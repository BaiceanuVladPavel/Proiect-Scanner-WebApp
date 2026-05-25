from django.urls import path

from apps.inventory.views import InventoryHistoryView, InventoryMoveView


urlpatterns = [
    path("inventory/move/", InventoryMoveView.as_view(), name="inventory-move"),
    path("inventory/history/", InventoryHistoryView.as_view(), name="inventory-history"),
]
