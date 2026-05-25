"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import { Search, Package2, Pencil, Trash2, Plus, TriangleAlert, ScanLine, CameraOff } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import type { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/image";
import { triggerHaptic } from "@/lib/haptics";
import { emitToast } from "@/lib/toast";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/services/products";
import type { ProductFormInput, ProductRecord } from "@/types/products";

const EMPTY_FORM: ProductFormInput = {
  name: "",
  barcode: "",
  sku: "",
  quantity: 0,
  min_quantity: 0,
  image: null,
};

const MAX_VISIBLE_PRODUCTS = 24;
const PRODUCT_BARCODE_SCANNER_ID = "product-barcode-scanner";
const productScannerConfig: Html5QrcodeCameraScanConfig = {
  aspectRatio: 1.777778,
  fps: 10,
  disableFlip: true,
  qrbox: (viewfinderWidth, viewfinderHeight) => ({
    width: Math.floor(Math.min(viewfinderWidth * 0.92, 420)),
    height: Math.floor(Math.min(viewfinderHeight * 0.28, 160)),
  }),
  videoConstraints: {
    facingMode: { exact: "environment" },
  },
};

function normalizeApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (detail && typeof detail === "object") {
      const first = Object.values(detail)[0];
      if (typeof first === "string") {
        return first;
      }
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
    if (typeof detail === "string") {
      return detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function ProductsShell() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [form, setForm] = useState<ProductFormInput>(EMPTY_FORM);
  const [message, setMessage] = useState("Search by name, barcode, or SKU.");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const barcodeScannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeScannerModuleRef = useRef<typeof import("html5-qrcode") | null>(null);
  const deferredSearch = useDeferredValue(search);
  const visibleProducts = products.slice(0, MAX_VISIBLE_PRODUCTS);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [barcodeScannerMessage, setBarcodeScannerMessage] = useState("Opening camera...");

  async function loadBarcodeScannerModule() {
    if (barcodeScannerModuleRef.current) {
      return barcodeScannerModuleRef.current;
    }

    const scannerModule = await import("html5-qrcode");
    barcodeScannerModuleRef.current = scannerModule;
    return scannerModule;
  }

  async function stopBarcodeScanner() {
    const scanner = barcodeScannerRef.current;
    barcodeScannerRef.current = null;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Best effort cleanup.
    }

    try {
      await scanner.clear();
    } catch {
      // Best effort cleanup.
    }
  }

  async function startBarcodeScanner() {
    setBarcodeScannerMessage("Opening camera...");
    setIsScanningBarcode(true);
  }

  async function loadProducts(nextSearch: string) {
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setLoading(true);
    try {
      const nextProducts = await listProducts(nextSearch, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => {
        setProducts(nextProducts);
        setMessage(nextProducts.length === 0 ? "No products found." : "Products loaded.");
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setMessage(normalizeApiError(error));
    } finally {
      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      void loadProducts(deferredSearch);
    }, deferredSearch ? 140 : 0);

    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [deferredSearch]);

  function resetForm() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImagePreview(null);
  }

  function startCreate() {
    resetForm();
    setMessage("Create a new product.");
  }

  function startEdit(product: ProductRecord) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      barcode: product.barcode,
      sku: product.sku,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      image: null,
    });
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImagePreview(product.image_path ?? product.image_url);
    setMessage("Edit product.");
  }

  function updateForm<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm() {
    const optimisticId = Date.now();
    const optimisticProduct: ProductRecord = {
      id: editingProduct?.id ?? optimisticId,
      name: form.name,
      barcode: form.barcode,
      sku: form.sku,
      quantity: form.quantity,
      min_quantity: form.min_quantity,
      image: null,
      image_path: imagePreview,
      image_url: imagePreview,
      created_at: editingProduct?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const previousProducts = products;
    setSaving(true);
    setMessage(editingProduct ? "Saving changes..." : "Creating product...");

    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id ? optimisticProduct : product,
        ),
      );
    } else {
      setProducts((current) => [optimisticProduct, ...current]);
    }

    try {
      const saved = editingProduct
        ? await updateProduct(editingProduct.id, form)
        : await createProduct(form);

      setProducts((current) => {
        if (editingProduct) {
          return current.map((product) => (product.id === editingProduct.id ? saved : product));
        }
        return [saved, ...current.filter((product) => product.id !== optimisticId)];
      });
      resetForm();
      setMessage(editingProduct ? "Product updated." : "Product created.");
      triggerHaptic();
      emitToast({
        title: editingProduct ? "Product updated" : "Product created",
        description: saved.name,
        tone: "success",
      });
    } catch (error) {
      setProducts(previousProducts);
      setMessage(normalizeApiError(error));
      emitToast({
        title: "Save failed",
        description: normalizeApiError(error),
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: number) {
    const previousProducts = products;
    setDeletingId(productId);
    setProducts((current) => current.filter((product) => product.id !== productId));
    setMessage("Deleting product...");

    try {
      await deleteProduct(productId);
      if (editingProduct?.id === productId) {
        resetForm();
      }
      setMessage("Product deleted.");
      triggerHaptic();
      emitToast({ title: "Product deleted", tone: "success" });
    } catch (error) {
      setProducts(previousProducts);
      setMessage(normalizeApiError(error));
      emitToast({
        title: "Delete failed",
        description: normalizeApiError(error),
        tone: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImageChange(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      updateForm("image", null);
      setImagePreview(editingProduct?.image_path ?? editingProduct?.image_url ?? null);
      return;
    }

    setMessage("Compressing image...");
    const compressed = await compressImage(file);
    const previewUrl = URL.createObjectURL(compressed);
    previewUrlRef.current = previewUrl;
    updateForm("image", compressed);
    setImagePreview(previewUrl);
    setMessage("Image ready.");
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      searchControllerRef.current?.abort();
      void stopBarcodeScanner();
    };
  }, []);

  useEffect(() => {
    if (!isScanningBarcode) {
      return;
    }

    let cancelled = false;

    const startWhenReady = async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 120));

      if (cancelled || document.getElementById(PRODUCT_BARCODE_SCANNER_ID) === null) {
        return;
      }

      try {
        const scannerModule = await loadBarcodeScannerModule();
        const scanner = new scannerModule.Html5Qrcode(PRODUCT_BARCODE_SCANNER_ID, {
          formatsToSupport: [
            scannerModule.Html5QrcodeSupportedFormats.CODE_128,
            scannerModule.Html5QrcodeSupportedFormats.CODE_39,
            scannerModule.Html5QrcodeSupportedFormats.CODE_93,
            scannerModule.Html5QrcodeSupportedFormats.EAN_13,
            scannerModule.Html5QrcodeSupportedFormats.EAN_8,
            scannerModule.Html5QrcodeSupportedFormats.ITF,
            scannerModule.Html5QrcodeSupportedFormats.UPC_A,
            scannerModule.Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });

        barcodeScannerRef.current = scanner;

        await scanner.start(
          { facingMode: { exact: "environment" } },
          productScannerConfig,
          async (decodedText) => {
            updateForm("barcode", decodedText);
            triggerHaptic(12);
            emitToast({
              title: "Barcode scanned",
              description: decodedText,
              tone: "success",
            });
            setBarcodeScannerMessage("Barcode detected.");
            await stopBarcodeScanner();
            setIsScanningBarcode(false);
          },
          () => undefined,
        );

        if (!cancelled) {
          setBarcodeScannerMessage("Align the barcode in the frame.");
        }
      } catch (error) {
        const nextMessage =
          error instanceof Error ? error.message : "Camera could not be started.";
        setBarcodeScannerMessage(nextMessage);
        emitToast({
          title: "Scanner failed",
          description: nextMessage,
          tone: "error",
        });
        await stopBarcodeScanner();
        setIsScanningBarcode(false);
      }
    };

    void startWhenReady();

    return () => {
      cancelled = true;
    };
  }, [isScanningBarcode]);

  return (
    <main className="dark min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#020617_100%)] px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
              Products
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Manage inventory</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="h-12 rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              onClick={startCreate}
            >
              <Plus className="size-4" />
              New
            </Button>
            <LogoutButton />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <Search className="size-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, barcode, SKU"
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
            />
          </div>
          <p className="mt-3 text-sm text-slate-400">{message}</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingProduct ? "Edit product" : "Create product"}
            </h2>
            {editingProduct ? (
              <button className="text-sm text-slate-400" onClick={resetForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Name"
              className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none placeholder:text-slate-500"
            />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input
                value={form.barcode}
                onChange={(event) => updateForm("barcode", event.target.value)}
                placeholder="Barcode"
                className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="outline"
                className="h-14 rounded-2xl border-cyan-400/20 bg-cyan-400/10 px-4 text-white hover:bg-cyan-400/20"
                onClick={() => void startBarcodeScanner()}
              >
                <ScanLine className="size-4.5" />
                Scan
              </Button>
            </div>
            <input
              value={form.sku}
              onChange={(event) => updateForm("sku", event.target.value)}
              placeholder="SKU"
              className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none placeholder:text-slate-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(event) => updateForm("quantity", Number(event.target.value))}
                placeholder="Quantity"
                className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none placeholder:text-slate-500"
              />
              <input
                type="number"
                min="0"
                value={form.min_quantity}
                onChange={(event) => updateForm("min_quantity", Number(event.target.value))}
                placeholder="Min quantity"
                className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="block h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:font-medium file:text-slate-950"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleImageChange(file);
              }}
            />
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Preview"
                width={512}
                height={224}
                sizes="(max-width: 768px) 100vw, 512px"
                className="h-28 w-full rounded-2xl object-cover"
                unoptimized={imagePreview.startsWith("blob:")}
              />
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/60 text-slate-500">
                <Package2 className="size-8" />
              </div>
            )}
            <Button
              className="h-14 w-full rounded-2xl bg-cyan-400 text-base font-semibold text-slate-950 hover:bg-cyan-300"
              disabled={saving}
              onClick={() => void submitForm()}
            >
              {saving ? "Saving..." : editingProduct ? "Save product" : "Create product"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
            </div>
          ) : null}

          {visibleProducts.map((product) => {
            const isLowStock = product.quantity <= product.min_quantity;

            return (
              <article
                key={product.id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  {product.image_url ? (
                    <Image
                      src={product.image_path ?? product.image_url}
                      alt={product.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="size-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                      <Package2 className="size-7" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-lg font-semibold">{product.name}</h3>
                      {isLowStock ? (
                        <div className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                          <TriangleAlert className="size-3.5" />
                          Low
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-400">{product.barcode}</p>
                    <p className="mt-1 text-sm text-slate-500">{product.sku || "No SKU"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-[20px] border border-white/10 bg-slate-950/70 p-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quantity</p>
                    <p className="mt-1 text-2xl font-semibold">{product.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Min</p>
                    <p className="mt-1 text-2xl font-semibold">{product.min_quantity}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => startEdit(product)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20"
                    disabled={deletingId === product.id}
                    onClick={() => void handleDelete(product.id)}
                  >
                    <Trash2 className="size-4" />
                    {deletingId === product.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </article>
            );
          })}

          {products.length > MAX_VISIBLE_PRODUCTS ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
              Showing first {MAX_VISIBLE_PRODUCTS} products for speed. Refine search to narrow results.
            </div>
          ) : null}
        </div>
      </section>

      {isScanningBarcode ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/82 backdrop-blur-md">
          <div className="w-full rounded-t-[32px] border border-white/10 bg-[#06101d] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-28px_80px_-36px_rgba(14,165,233,0.55)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
                  Barcode Scanner
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">Scan product barcode</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-white/15 bg-white/5 px-4 text-white hover:bg-white/10"
                onClick={() => {
                  void stopBarcodeScanner();
                  setIsScanningBarcode(false);
                }}
              >
                <CameraOff className="size-4.5" />
                Close
              </Button>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950">
              <div id={PRODUCT_BARCODE_SCANNER_ID} className="h-[46svh] w-full" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.35),transparent_18%,transparent_82%,rgba(2,6,23,0.5))]" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(24vw,5.5rem)] w-[min(88vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-cyan-300/45 bg-cyan-300/4 shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_36px_rgba(34,211,238,0.14)]">
                <span className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-cyan-300/70" />
                <span className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-l-[1.75rem] border-l-4 border-b-4 border-t-4 border-cyan-300" />
                <span className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-r-[1.75rem] border-r-4 border-b-4 border-t-4 border-cyan-300" />
              </div>
            </div>

            <p className="mt-3 text-center text-sm text-slate-300">{barcodeScannerMessage}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
