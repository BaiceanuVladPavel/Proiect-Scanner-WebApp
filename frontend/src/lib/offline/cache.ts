import { OFFLINE_PRODUCT_CACHE_KEY } from "@/lib/offline/constants";
import type { CachedProductRecord } from "@/types/offline";
import type { Product } from "@/types/inventory";

type ProductCacheMap = Record<string, CachedProductRecord>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCacheMap(): ProductCacheMap {
  if (!canUseStorage()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(OFFLINE_PRODUCT_CACHE_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as ProductCacheMap;
  } catch {
    return {};
  }
}

function writeCacheMap(cacheMap: ProductCacheMap) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(OFFLINE_PRODUCT_CACHE_KEY, JSON.stringify(cacheMap));
}

export function getCachedProduct(barcode: string) {
  const cacheMap = readCacheMap();
  return cacheMap[barcode] ?? null;
}

export function cacheProduct(product: Product) {
  const cacheMap = readCacheMap();
  cacheMap[product.barcode] = {
    product,
    cachedAt: new Date().toISOString(),
  };
  writeCacheMap(cacheMap);
}

export function removeCachedProduct(barcode: string) {
  const cacheMap = readCacheMap();
  delete cacheMap[barcode];
  writeCacheMap(cacheMap);
}

export function listCachedProducts() {
  return Object.values(readCacheMap());
}

export function clearCachedProducts() {
  writeCacheMap({});
}
