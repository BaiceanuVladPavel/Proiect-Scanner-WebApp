const OFFLINE_SW_CHANNEL = "inventory-offline-channel";
const RUNTIME_CACHE = "inventory-runtime-v1";
const IMAGE_CACHE = "inventory-images-v1";

type WorkerClient = {
  postMessage: (message: unknown) => void;
};

type WorkerScope = typeof globalThis & {
  skipWaiting: () => Promise<void>;
  clients: {
    claim: () => Promise<void>;
    matchAll: (options?: {
      type?: string;
      includeUncontrolled?: boolean;
    }) => Promise<WorkerClient[]>;
  };
};

const serviceWorkerScope = self as unknown as WorkerScope;

serviceWorkerScope.addEventListener("install", () => {
  void serviceWorkerScope.skipWaiting();
});

serviceWorkerScope.addEventListener("activate", (event) => {
  (event as unknown as { waitUntil: (promise: Promise<void>) => void }).waitUntil(
    serviceWorkerScope.clients.claim(),
  );
});

serviceWorkerScope.addEventListener("message", (event) => {
  const data = (event as { data?: unknown }).data as
    | { channel?: string; type?: string; pendingCount?: number }
    | undefined;

  if (!data || data.channel !== OFFLINE_SW_CHANNEL) {
    return;
  }

  if (data.type === "OFFLINE_QUEUE_UPDATED") {
    void notifyAllClients({
      type: "OFFLINE_QUEUE_UPDATED",
      pendingCount: data.pendingCount ?? 0,
    });
    return;
  }

  if (data.type === "OFFLINE_SYNC_PLACEHOLDER") {
    void notifyAllClients({ type: "OFFLINE_SYNC_PLACEHOLDER" });
  }
});

serviceWorkerScope.addEventListener("fetch", (event) => {
  const fetchEvent = event as unknown as {
    request: Request;
    respondWith: (response: Promise<Response>) => void;
  };
  const request = fetchEvent.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/media/") && !url.pathname.startsWith("/api/products/")) {
    return;
  }

  fetchEvent.respondWith(staleWhileReachable(request));
});

async function staleWhileReachable(request: Request) {
  const cacheName = request.url.includes("/media/") ? IMAGE_CACHE : RUNTIME_CACHE;
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error("Offline foundation cache miss.");
  }
}

async function notifyAllClients(message: {
  type: "OFFLINE_QUEUE_UPDATED" | "OFFLINE_SYNC_PLACEHOLDER";
  pendingCount?: number;
}) {
  const clients = await serviceWorkerScope.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  await Promise.all(clients.map((client) => client.postMessage(message)));
}
