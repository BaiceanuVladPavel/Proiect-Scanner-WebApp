import type { InventoryAction } from "@/services/inventory";
import type { Product } from "@/types/inventory";

export type OfflineQueueActionType = "inventory.move";

export type PendingInventoryMovePayload = {
  barcode: string;
  movement_type: InventoryAction;
  quantity: number;
};

export type OfflineQueueItem = {
  id: string;
  type: OfflineQueueActionType;
  payload: PendingInventoryMovePayload;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

export type CachedProductRecord = {
  product: Product;
  cachedAt: string;
};

export type ServiceWorkerOfflineMessage =
  | { type: "OFFLINE_QUEUE_UPDATED"; pendingCount: number }
  | { type: "OFFLINE_CACHE_WARMED"; barcode: string }
  | { type: "OFFLINE_SYNC_PLACEHOLDER" };
