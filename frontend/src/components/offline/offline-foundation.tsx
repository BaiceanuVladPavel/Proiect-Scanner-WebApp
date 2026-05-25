"use client";

import { useEffect } from "react";

import { getPendingQueueCount } from "@/lib/offline/queue";
import { broadcastOfflineQueueCount, subscribeToOfflineWorker } from "@/lib/offline/sw-client";

export function OfflineFoundation() {
  useEffect(() => {
    const unsubscribe = subscribeToOfflineWorker((message) => {
      if (message.type === "OFFLINE_QUEUE_UPDATED") {
        return;
      }

      if (message.type === "OFFLINE_CACHE_WARMED") {
        return;
      }
    });

    broadcastOfflineQueueCount(getPendingQueueCount());

    return unsubscribe;
  }, []);

  return null;
}
