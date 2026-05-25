import { OFFLINE_QUEUE_KEY } from "@/lib/offline/constants";
import type { OfflineQueueItem, PendingInventoryMovePayload } from "@/types/offline";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readQueue() {
  if (!canUseStorage()) {
    return [] as OfflineQueueItem[];
  }

  const rawValue = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!rawValue) {
    return [] as OfflineQueueItem[];
  }

  try {
    return JSON.parse(rawValue) as OfflineQueueItem[];
  } catch {
    return [] as OfflineQueueItem[];
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

function createQueueId() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listPendingQueueItems() {
  return readQueue();
}

export function getPendingQueueCount() {
  return readQueue().length;
}

export function enqueueInventoryMove(payload: PendingInventoryMovePayload) {
  const nextItem: OfflineQueueItem = {
    id: createQueueId(),
    type: "inventory.move",
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };

  const items = readQueue();
  writeQueue([...items, nextItem]);
  return nextItem;
}

export function markQueueItemAttempt(queueItemId: string, lastError: string | null) {
  const items = readQueue().map((item) =>
    item.id === queueItemId
      ? {
          ...item,
          attempts: item.attempts + 1,
          lastError,
        }
      : item,
  );
  writeQueue(items);
}

export function removeQueueItem(queueItemId: string) {
  writeQueue(readQueue().filter((item) => item.id !== queueItemId));
}

export function clearPendingQueue() {
  writeQueue([]);
}
