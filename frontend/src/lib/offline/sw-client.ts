import { OFFLINE_SW_CHANNEL } from "@/lib/offline/constants";
import type { ServiceWorkerOfflineMessage } from "@/types/offline";

export function postOfflineWorkerMessage(message: Record<string, unknown>) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage(message);
}

export function subscribeToOfflineWorker(
  listener: (message: ServiceWorkerOfflineMessage) => void,
) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => undefined;
  }

  const handleMessage = (event: MessageEvent<ServiceWorkerOfflineMessage>) => {
    if (!event.data || typeof event.data !== "object") {
      return;
    }

    listener(event.data);
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}

export function broadcastOfflineQueueCount(pendingCount: number) {
  postOfflineWorkerMessage({
    channel: OFFLINE_SW_CHANNEL,
    type: "OFFLINE_QUEUE_UPDATED",
    pendingCount,
  });
}
