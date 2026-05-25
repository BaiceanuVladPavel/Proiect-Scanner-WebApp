import { api } from "@/lib/api";
import { cacheProduct } from "@/lib/offline/cache";
import { broadcastOfflineQueueCount } from "@/lib/offline/sw-client";
import { enqueueInventoryMove, getPendingQueueCount } from "@/lib/offline/queue";
import type {
  InventoryHistoryEntry,
  InventoryHistoryFilter,
  InventoryMoveResponse,
  Product,
} from "@/types/inventory";
import type { PendingInventoryMovePayload } from "@/types/offline";

export type InventoryAction = "IN" | "OUT" | "DAMAGED" | "RETURN";

export async function fetchProductByBarcode(barcode: string, signal?: AbortSignal) {
  const response = await api.get<Product>(`/products/${encodeURIComponent(barcode)}`, {
    signal,
  });
  cacheProduct(response.data);
  return response.data;
}

export async function moveInventory(input: {
  barcode: string;
  movement_type: InventoryAction;
  quantity: number;
}) {
  const response = await api.post<InventoryMoveResponse>("/inventory/move", input);
  cacheProduct(response.data.product);
  return response.data;
}

export function queuePendingInventoryMove(input: PendingInventoryMovePayload) {
  const item = enqueueInventoryMove(input);
  broadcastOfflineQueueCount(getPendingQueueCount());
  return item;
}

export async function listInventoryHistory(
  filter: InventoryHistoryFilter,
  signal?: AbortSignal,
) {
  const response = await api.get<InventoryHistoryEntry[]>("/inventory/history/", {
    params: {
      product: filter.product || undefined,
      movement_type: filter.movement_type || undefined,
      date: filter.date || undefined,
    },
    signal,
  });
  return response.data;
}
