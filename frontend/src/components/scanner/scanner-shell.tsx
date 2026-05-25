"use client";

import { AxiosError } from "axios";
import { memo, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  Flashlight,
  Minus,
  Package2,
  Plus,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import type { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/components/auth/logout-button";
import { triggerHaptic } from "@/lib/haptics";
import { emitToast } from "@/lib/toast";
import {
  fetchProductByBarcode,
  moveInventory,
  type InventoryAction,
} from "@/services/inventory";
import type { Product } from "@/types/inventory";

const SCANNER_REGION_ID = "inventory-scanner-region";
const READY_AFTER_ACTION_MS = 260;
const DUPLICATE_WINDOW_MS = 1600;

const scannerConfig: Html5QrcodeCameraScanConfig = {
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

type ScannerStatus =
  | "idle"
  | "requesting"
  | "permission-denied"
  | "scanning"
  | "result"
  | "paused"
  | "error";

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };
type ResultState = "idle" | "loading" | "ready" | "missing" | "error";
type MoveAction = InventoryAction | null;
type InventoryQuickAction = {
  key: string;
  label: string;
  movementType: InventoryAction;
  icon: typeof Plus;
  variant: "positive" | "neutral";
};

type ProductResultCardProps = {
  lastCode: string;
  product: Product | null;
  resultState: ResultState;
  resultMessage: string;
};

type QuickActionsProps = {
  disabled: boolean;
  pendingMove: MoveAction;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onMove: (movementType: InventoryAction, quantity: number) => void;
};

const QUICK_ACTIONS: InventoryQuickAction[] = [
  {
    key: "in-1",
    label: "+1",
    movementType: "IN",
    icon: Plus,
    variant: "positive",
  },
  {
    key: "out-1",
    label: "-1",
    movementType: "OUT",
    icon: Minus,
    variant: "neutral",
  },
];

function normalizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Camera could not be started.";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("permission") ||
    message.includes("denied") ||
    message.includes("notallowederror")
  ) {
    return "Camera permission was denied. Allow camera access in Safari and try again.";
  }

  if (message.includes("secure") || message.includes("https")) {
    return "Camera needs HTTPS on iPhone Safari. Open the app through ngrok HTTPS.";
  }

  if (message.includes("notfound") || message.includes("no camera")) {
    return "No camera was found on this device.";
  }

  return error.message;
}

function normalizeApiError(error: unknown) {
  if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
    return "Request canceled.";
  }

  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (typeof detail === "string") {
      return detail;
    }

    if (detail && typeof detail === "object") {
      if ("detail" in detail && typeof detail.detail === "string") {
        return detail.detail;
      }

      const firstValue = Object.values(detail)[0];
      if (typeof firstValue === "string") {
        return firstValue;
      }

      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0];
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

const ProductResultCard = memo(function ProductResultCard({
  lastCode,
  product,
  resultState,
  resultMessage,
}: ProductResultCardProps) {
  const isLowStock = product !== null && product.quantity <= product.min_quantity;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Scanned Result
        </p>
        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
          {resultState === "ready"
            ? "Loaded"
            : resultState === "loading"
              ? "Loading"
              : "Waiting"}
        </span>
      </div>

      {resultState === "loading" ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-18 rounded-[20px]" />
          <Skeleton className="h-20 rounded-[20px]" />
        </div>
      ) : product ? (
        <div className="mt-3 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
              <Package2 className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold leading-7 text-white">{product.name}</p>
              <p className="mt-1 break-all text-sm text-slate-400">{product.barcode}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-slate-950/70 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quantity
              </p>
              <p className="mt-1 text-3xl font-semibold text-white">{product.quantity}</p>
            </div>
            {isLowStock ? (
              <div className="flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-200">
                <TriangleAlert className="size-4" />
                Low stock
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-[20px] border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
          <p>{lastCode || "No barcode scanned yet."}</p>
        </div>
      )}

      <p className="mt-3 text-sm leading-6 text-slate-300">{resultMessage}</p>
    </div>
  );
});

const QuickActions = memo(function QuickActions({
  disabled,
  pendingMove,
  quantity,
  onQuantityChange,
  onMove,
}: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        const isPending = pendingMove === action.movementType;
        const className =
          action.variant === "positive"
            ? "bg-emerald-400 text-slate-950 shadow-[0_18px_50px_-20px_rgba(74,222,128,0.8)] hover:bg-emerald-300"
            : "border-white/15 bg-white/5 text-white hover:bg-white/10";

        return (
          <Button
            key={action.key}
            variant={action.variant === "positive" ? "default" : "outline"}
            className={`h-16 rounded-[22px] text-base font-semibold ${className}`}
            disabled={disabled}
            onClick={() => onMove(action.movementType, quantity)}
          >
            <Icon className="size-4.5" />
            {isPending
              ? "..."
              : action.movementType === "IN"
                ? `+${quantity}`
                : `-${quantity}`}
          </Button>
        );
        })}
      </div>

      <div className="rounded-[22px] border border-white/10 bg-slate-950/65 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-300">Quantity per tap</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 w-11 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              disabled={disabled || quantity <= 1}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <div className="min-w-14 rounded-2xl bg-white/6 px-3 py-2 text-center text-lg font-semibold text-white">
              {quantity}
            </div>
            <Button
              variant="outline"
              className="h-11 w-11 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              disabled={disabled || quantity >= 999}
              onClick={() => onQuantityChange(Math.min(999, quantity + 1))}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export function ScannerShell() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const html5QrcodeRef = useRef<typeof import("html5-qrcode") | null>(null);
  const mountedRef = useRef(false);
  const actionRef = useRef<Promise<void>>(Promise.resolve());
  const resumeTimerRef = useRef<number | null>(null);
  const lastScanAtRef = useRef(0);
  const lastValueRef = useRef("");
  const scanLockRef = useRef(false);
  const desiredRunningRef = useRef(true);
  const scanSessionRef = useRef(0);
  const lookupControllerRef = useRef<AbortController | null>(null);
  const resultSessionRef = useRef(0);
  const productCacheRef = useRef(new Map<string, Product>());

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("Preparing camera...");
  const [lastCode, setLastCode] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState("unknown");
  const [product, setProduct] = useState<Product | null>(null);
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [resultMessage, setResultMessage] = useState("Scan a barcode to view the item.");
  const [pendingMove, setPendingMove] = useState<MoveAction>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  function clearResumeTimer() {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }

  function cancelLookupRequest() {
    lookupControllerRef.current?.abort();
    lookupControllerRef.current = null;
  }

  function scheduleReturnToScanner(
    activeScanSession: number,
    delayMs: number,
    nextMessage = "Ready for the next barcode.",
  ) {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      scanLockRef.current = false;

      if (
        !mountedRef.current ||
        !desiredRunningRef.current ||
        activeScanSession !== scanSessionRef.current
      ) {
        return;
      }

      setStatus("scanning");
      setMessage(nextMessage);
      setPendingMove(null);
      setSelectedQuantity(1);
      setProduct(null);
      setResultState("idle");
      setResultMessage("Scan a barcode to view the item.");
    }, delayMs);
  }

  function queueAction(task: () => Promise<void>) {
    actionRef.current = actionRef.current
      .catch(() => undefined)
      .then(task)
      .catch(() => undefined);

    return actionRef.current;
  }

  async function loadScannerModule() {
    if (html5QrcodeRef.current) {
      return html5QrcodeRef.current;
    }

    const scannerModule = await import("html5-qrcode");
    html5QrcodeRef.current = scannerModule;
    return scannerModule;
  }

  async function detectPermissionState() {
    if (
      typeof navigator === "undefined" ||
      !("permissions" in navigator) ||
      !navigator.permissions?.query
    ) {
      return "unknown";
    }

    try {
      const status = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      return status.state;
    } catch {
      return "unknown";
    }
  }

  async function stopScannerCore(nextStatus: ScannerStatus, nextMessage: string) {
    clearResumeTimer();
    cancelLookupRequest();
    scanLockRef.current = false;
    resultSessionRef.current += 1;

    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // html5-qrcode can throw when stop overlaps browser teardown.
      }

      try {
        await scanner.clear();
      } catch {
        // Best-effort DOM cleanup after stopping the track.
      }
    }

    if (!mountedRef.current) {
      return;
    }

    setTorchEnabled(false);
    setStatus(nextStatus);
    setMessage(nextMessage);
  }

  async function stopScanner(
    nextStatus: ScannerStatus = "paused",
    nextMessage = "Scanner paused.",
  ) {
    desiredRunningRef.current = false;
    await queueAction(() => stopScannerCore(nextStatus, nextMessage));
  }

  async function loadProductResult(barcode: string): Promise<ResultState> {
    const requestSession = resultSessionRef.current;
    const cachedProduct = productCacheRef.current.get(barcode);

    if (cachedProduct) {
      setProduct(cachedProduct);
      setResultState("ready");
      setResultMessage("Product loaded.");
      emitToast({ title: "Product ready", description: cachedProduct.name });
      return "ready";
    }

    cancelLookupRequest();
    const controller = new AbortController();
    lookupControllerRef.current = controller;
    setResultState("loading");
    setResultMessage("Loading product...");

    try {
      const nextProduct = await fetchProductByBarcode(barcode, controller.signal);
      if (
        !mountedRef.current ||
        requestSession !== resultSessionRef.current ||
        controller.signal.aborted
      ) {
        return "idle";
      }

      setProduct(nextProduct);
      productCacheRef.current.set(barcode, nextProduct);
      setResultState("ready");
      setResultMessage("Product loaded.");
      return "ready";
    } catch (error) {
      if (
        !mountedRef.current ||
        requestSession !== resultSessionRef.current ||
        controller.signal.aborted
      ) {
        return "idle";
      }

      const messageText = normalizeApiError(error);
      if (error instanceof AxiosError && error.response?.status === 404) {
        setProduct(null);
        setResultState("missing");
        setResultMessage(messageText);
        emitToast({ title: "Product not found", description: barcode, tone: "error" });
        return "missing";
      }

      setProduct(null);
      setResultState("error");
      setResultMessage(messageText);
      emitToast({ title: "Lookup failed", description: messageText, tone: "error" });
      return "error";
    } finally {
      if (lookupControllerRef.current === controller) {
        lookupControllerRef.current = null;
      }
    }

    return "idle";
  }

  async function handleAcceptedScan(decodedText: string) {
    const activeSession = scanSessionRef.current;
    const now = Date.now();
    const duplicate =
      decodedText === lastValueRef.current && now - lastScanAtRef.current < DUPLICATE_WINDOW_MS;

    if (duplicate || scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;
    lastValueRef.current = decodedText;
    lastScanAtRef.current = now;

    if (!mountedRef.current) {
      return;
    }

    setLastCode(decodedText);
    setStatus("result");
    setMessage("Barcode captured.");
    setProduct(null);
    setResultState("idle");
    setPendingMove(null);
    setSelectedQuantity(1);
    resultSessionRef.current += 1;
    triggerHaptic(10);

    const lookupState = await loadProductResult(decodedText);

    if (
      !mountedRef.current ||
      !desiredRunningRef.current ||
      activeSession !== scanSessionRef.current
    ) {
      return;
    }

    if (lookupState === "missing") {
      scanLockRef.current = false;
      return;
    }

    if (lookupState === "error" || lookupState === "idle") {
      scanLockRef.current = false;
      return;
    }
  }

  async function startScannerCore() {
    const activeSession = ++scanSessionRef.current;
    clearResumeTimer();
    cancelLookupRequest();
    scanLockRef.current = false;

    if (!mountedRef.current) {
      return;
    }

    setTorchEnabled(false);
    setStatus("requesting");

    const permission = await detectPermissionState();
    if (mountedRef.current) {
      setPermissionState(permission);
    }

    setMessage(
      permission === "denied"
        ? "Camera permission is blocked."
        : "Opening rear camera...",
    );

    if (permission === "denied") {
      setStatus("permission-denied");
      setMessage("Camera permission is blocked. Allow access in Safari settings.");
      return;
    }

    await stopScannerCore("idle", "Preparing camera...");

    const scannerModule = await loadScannerModule();
    const scanner = new scannerModule.Html5Qrcode(SCANNER_REGION_ID, {
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

    const onScanSuccess = (decodedText: string) => {
      void handleAcceptedScan(decodedText);
    };

    try {
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: { exact: "environment" } },
        scannerConfig,
        onScanSuccess,
        () => undefined,
      );

      if (
        !mountedRef.current ||
        !desiredRunningRef.current ||
        activeSession !== scanSessionRef.current
      ) {
        await stopScannerCore("paused", "Scanner paused.");
        return;
      }

      setPermissionState("granted");
      setStatus("scanning");
      setMessage("Aim at a barcode.");
    } catch (error) {
      scannerRef.current = null;
      const normalized = normalizeError(error);
      const denied = normalized.toLowerCase().includes("permission");

      setStatus(denied ? "permission-denied" : "error");
      setMessage(normalized);
      if (denied) {
        setPermissionState("denied");
      }

      try {
        await scanner.clear();
      } catch {
        // Best-effort cleanup for failed starts.
      }
    }
  }

  async function startScanner() {
    desiredRunningRef.current = true;
    await queueAction(startScannerCore);
  }

  async function restartScanner() {
    desiredRunningRef.current = true;
    scanSessionRef.current += 1;
    lastValueRef.current = "";
    lastScanAtRef.current = 0;
    setLastCode("");
    setProduct(null);
    setResultState("idle");
    setResultMessage("Scan a barcode to view the item.");
    setPendingMove(null);
    setSelectedQuantity(1);
    await queueAction(async () => {
      await stopScannerCore("idle", "Restarting camera...");
      await startScannerCore();
    });
  }

  async function submitMove(movementType: InventoryAction, quantity: number) {
    if (!lastCode || !product || pendingMove) {
      return;
    }

    const actionSession = resultSessionRef.current;
    const targetBarcode = lastCode;
    const delta =
      movementType === "OUT" || movementType === "DAMAGED" ? -quantity : quantity;
    const optimisticQuantity = product.quantity + delta;

    if (optimisticQuantity < 0) {
      setResultMessage("Stock cannot go negative.");
      return;
    }

    const previousProduct = product;
    setPendingMove(movementType);
    setProduct({ ...product, quantity: optimisticQuantity });
    setResultMessage("Updating stock...");

    try {
      const response = await moveInventory({
        barcode: targetBarcode,
        movement_type: movementType,
        quantity,
      });

      if (
        !mountedRef.current ||
        actionSession !== resultSessionRef.current ||
        targetBarcode !== lastValueRef.current
      ) {
        return;
      }

      setProduct(response.product);
      productCacheRef.current.set(targetBarcode, response.product);
      setResultState("ready");
      setResultMessage(
        movementType === "DAMAGED"
          ? "Marked as damaged."
          : movementType === "RETURN"
            ? "Return recorded."
            : "Quantity updated.",
      );
      triggerHaptic(16);
      emitToast({
        title: movementType === "DAMAGED" ? "Damaged recorded" : "Stock updated",
        description: response.product.name,
        tone: "success",
      });
      scheduleReturnToScanner(scanSessionRef.current, READY_AFTER_ACTION_MS);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      if (actionSession === resultSessionRef.current && targetBarcode === lastValueRef.current) {
        setProduct(previousProduct);
      }
      const nextMessage = normalizeApiError(error);
      setResultMessage(nextMessage);
      emitToast({ title: "Update failed", description: nextMessage, tone: "error" });
    } finally {
      if (mountedRef.current) {
        setPendingMove(null);
      }
    }
  }

  async function toggleTorch() {
    const scanner = scannerRef.current;

    if (!scanner?.isScanning) {
      setMessage("Start the scanner before using torch.");
      return;
    }

    try {
      const capabilities =
        scanner.getRunningTrackCapabilities() as TorchCapabilities | null;

      if (!capabilities?.torch) {
        setMessage("Torch is not available on this camera.");
        return;
      }

      await scanner.applyVideoConstraints({
        advanced: [{ torch: !torchEnabled } as TorchConstraintSet],
      });

      const nextTorchEnabled = !torchEnabled;
      setTorchEnabled(nextTorchEnabled);
      setMessage(nextTorchEnabled ? "Torch turned on." : "Torch turned off.");
    } catch {
      setMessage("Torch control is not supported in this browser.");
    }
  }

  const handleMountStart = useEffectEvent(() => {
    void startScanner();
  });

  const handleUnmountStop = useEffectEvent(() => {
    void stopScannerCore("paused", "Scanner closed.");
  });

  const handleVisibilityPause = useEffectEvent(() => {
    desiredRunningRef.current = false;
    void queueAction(() => stopScannerCore("paused", "Scanner paused."));
  });

  const handlePageShowResume = useEffectEvent(() => {
    if (!document.hidden && mountedRef.current) {
      void startScanner();
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    handleMountStart();

    return () => {
      mountedRef.current = false;
      desiredRunningRef.current = false;
      clearResumeTimer();
      cancelLookupRequest();
      handleUnmountStop();
    };
  }, []);

  useEffect(() => {
    const preloadScanner = () => {
      void loadScannerModule();
    };

    if (typeof window === "undefined") {
      return;
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadScanner, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(preloadScanner, 350);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        handleVisibilityPause();
      }
    };

    const handlePageShow = () => {
      handlePageShowResume();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const isBusy = status === "requesting";
  const isLive = status === "scanning" || status === "result";
  const statusIcon =
    status === "permission-denied" || status === "error" ? (
      <AlertCircle className="size-4 text-rose-300" />
    ) : isLive ? (
      <CheckCircle2 className="size-4 text-emerald-300" />
    ) : (
      <Camera className="size-4 text-cyan-200" />
    );

  return (
    <main className="dark min-h-screen bg-[#020617] text-white">
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />

        <div className="relative z-10 flex items-center justify-between px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/75">
              Live Scanner
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Scan items fast
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 backdrop-blur">
              {permissionState === "granted" ? "Camera ready" : "iPhone-first"}
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className="relative flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
          <div className="flex h-full flex-col gap-4 rounded-[32px] border border-white/10 bg-black/30 px-0 pb-4 shadow-[0_30px_120px_-40px_rgba(14,165,233,0.45)] backdrop-blur-md">
            <div className="px-4 pb-1 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                  {statusIcon}
                  <span>{message}</span>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="relative min-h-[42svh] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950">
                <div id={SCANNER_REGION_ID} className="h-full w-full" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.35),transparent_18%,transparent_82%,rgba(2,6,23,0.5))]" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(24vw,5.5rem)] w-[min(88vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-cyan-300/45 bg-cyan-300/4 shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_36px_rgba(34,211,238,0.14)]">
                  <span className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-cyan-300/70" />
                  <span className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-l-[1.75rem] border-l-4 border-t-4 border-b-4 border-cyan-300" />
                  <span className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-r-[1.75rem] border-r-4 border-t-4 border-b-4 border-cyan-300" />
                </div>
              </div>
            </div>

            <div className="space-y-4 px-4">
              <ProductResultCard
                lastCode={lastCode}
                product={product}
                resultState={resultState}
                resultMessage={resultMessage}
              />

              <QuickActions
                disabled={product === null || pendingMove !== null}
                pendingMove={pendingMove}
                quantity={selectedQuantity}
                onQuantityChange={setSelectedQuantity}
                onMove={(movementType, quantity) => void submitMove(movementType, quantity)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-16 rounded-[22px] bg-cyan-400 text-base font-semibold text-slate-950 shadow-[0_18px_50px_-20px_rgba(34,211,238,0.9)] hover:bg-cyan-300"
                  disabled={isBusy}
                  onClick={() => void startScanner()}
                >
                  <Camera className="size-5" />
                  {isBusy ? "Opening..." : isLive ? "Scanning" : "Start Scan"}
                </Button>
                <Button
                  variant="outline"
                  className="h-16 rounded-[22px] border-white/15 bg-white/5 text-base font-semibold text-white hover:bg-white/10"
                  disabled={isBusy}
                  onClick={() => void stopScanner()}
                >
                  <CameraOff className="size-5" />
                  Stop
                </Button>
                <Button
                  variant="outline"
                  className="h-16 rounded-[22px] border-white/15 bg-white/5 text-base font-semibold text-white hover:bg-white/10"
                  disabled={isBusy}
                  onClick={() => void restartScanner()}
                >
                  <RotateCcw className="size-5" />
                  Restart
                </Button>
                <Button
                  variant="outline"
                  className="h-16 rounded-[22px] border-white/15 bg-white/5 text-base font-semibold text-white hover:bg-white/10"
                  disabled={!isLive}
                  onClick={() => void toggleTorch()}
                >
                  <Flashlight className="size-5" />
                  {torchEnabled ? "Torch On" : "Torch"}
                </Button>
              </div>

              <p className="px-1 text-center text-sm leading-6 text-slate-400">
                Scan, tap one action, and the camera is ready again.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
