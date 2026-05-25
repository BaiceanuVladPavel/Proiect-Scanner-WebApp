"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { CalendarDays, Funnel, Package2, Search } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { emitToast } from "@/lib/toast";
import { listInventoryHistory } from "@/services/inventory";
import type { InventoryHistoryEntry, InventoryHistoryFilter, MovementType } from "@/types/inventory";

const MOVEMENT_OPTIONS: Array<{ label: string; value: "" | MovementType }> = [
  { label: "All types", value: "" },
  { label: "In", value: "IN" },
  { label: "Out", value: "OUT" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Return", value: "RETURN" },
  { label: "Adjustment", value: "ADJUSTMENT" },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDelta(quantityDelta: number) {
  return quantityDelta > 0 ? `+${quantityDelta}` : String(quantityDelta);
}

export function HistoryShell() {
  const [entries, setEntries] = useState<InventoryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InventoryHistoryFilter>({
    product: "",
    movement_type: "",
    date: "",
  });
  const [message, setMessage] = useState("Filter inventory movements.");
  const deferredProduct = useDeferredValue(filter.product);
  const filterTimerRef = useRef<number | null>(null);
  const historyControllerRef = useRef<AbortController | null>(null);
  const visibleEntries = entries.slice(0, 40);

  async function loadHistory(nextFilter: InventoryHistoryFilter) {
    historyControllerRef.current?.abort();
    const controller = new AbortController();
    historyControllerRef.current = controller;
    setLoading(true);
    try {
      const nextEntries = await listInventoryHistory(nextFilter, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => {
        setEntries(nextEntries);
        setMessage(nextEntries.length === 0 ? "No movements found." : "History loaded.");
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const nextMessage = error instanceof Error ? error.message : "Failed to load history.";
      setMessage(nextMessage);
      emitToast({ title: "History load failed", description: nextMessage, tone: "error" });
    } finally {
      if (historyControllerRef.current === controller) {
        historyControllerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (filterTimerRef.current !== null) {
      window.clearTimeout(filterTimerRef.current);
    }
    filterTimerRef.current = window.setTimeout(() => {
      void loadHistory({
        product: deferredProduct,
        movement_type: filter.movement_type,
        date: filter.date,
      });
    }, deferredProduct || filter.movement_type || filter.date ? 180 : 0);

    return () => {
      if (filterTimerRef.current !== null) {
        window.clearTimeout(filterTimerRef.current);
      }
      historyControllerRef.current?.abort();
    };
  }, [deferredProduct, filter.movement_type, filter.date]);

  return (
    <main className="dark min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#020617_100%)] px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
              Inventory History
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Movement timeline</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <Search className="size-5 text-slate-400" />
            <input
              value={filter.product}
              onChange={(event) =>
                setFilter((current) => ({ ...current, product: event.target.value }))
              }
              placeholder="Filter by product, barcode, SKU"
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
              <Funnel className="size-4.5 text-slate-400" />
              <select
                value={filter.movement_type}
                onChange={(event) =>
                  setFilter((current) => ({
                    ...current,
                    movement_type: event.target.value as InventoryHistoryFilter["movement_type"],
                  }))
                }
                className="w-full bg-transparent text-sm text-white outline-none"
              >
                {MOVEMENT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
              <CalendarDays className="size-4.5 text-slate-400" />
              <input
                type="date"
                value={filter.date}
                onChange={(event) =>
                  setFilter((current) => ({ ...current, date: event.target.value }))
                }
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setFilter({ product: "", movement_type: "", date: "" })}
            >
              Clear filters
            </Button>
          </div>

          <p className="mt-3 text-sm text-slate-400">{message}</p>
        </div>

        <div className="space-y-3 overflow-y-auto pb-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
            </div>
          ) : null}

          {visibleEntries.map((entry) => {
            const positive = entry.quantity_delta > 0;
            const badgeClass = positive
              ? "bg-emerald-400/10 text-emerald-200"
              : entry.movement_type === "DAMAGED"
                ? "bg-rose-400/10 text-rose-200"
                : "bg-white/8 text-slate-200";

            return (
              <article
                key={entry.id}
                className="relative rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="absolute bottom-0 left-8 top-0 w-px bg-white/10" />
                <div className="relative flex items-start gap-3">
                  <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200 ring-8 ring-[#08111f]">
                    <Package2 className="size-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-white">
                          {entry.product_name}
                        </h2>
                        <p className="mt-1 break-all text-xs text-slate-400">
                          {entry.barcode}
                          {entry.product_sku ? ` · ${entry.product_sku}` : ""}
                        </p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
                        {formatDelta(entry.quantity_delta)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="rounded-full bg-white/8 px-3 py-1.5 font-medium text-slate-200">
                        {entry.movement_type}
                      </span>
                      <span className="text-slate-400">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {entries.length > visibleEntries.length ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
              Showing latest {visibleEntries.length} movements for smooth scrolling. Use filters to narrow results.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
