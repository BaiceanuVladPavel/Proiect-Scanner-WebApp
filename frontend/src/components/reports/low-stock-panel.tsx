"use client";

import Image from "next/image";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getLowStockReport } from "@/services/reports";
import type { LowStockItem, LowStockResponse } from "@/types/reports";

function LowStockCard({ item }: { item: LowStockItem }) {
  return (
    <article className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-4">
      <div className="flex items-start gap-3">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            width={56}
            height={56}
            className="size-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-100">
            <TriangleAlert className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white">{item.name}</h3>
              <p className="mt-1 break-all text-xs text-rose-100/80">
                {item.barcode}
                {item.sku ? ` · ${item.sku}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-rose-400/15 px-2.5 py-1 text-xs font-semibold text-rose-100">
              Alert
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 rounded-[18px] bg-black/20 p-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-100/70">Qty</p>
              <p className="mt-1 text-2xl font-semibold text-white">{item.quantity}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-100/70">Min</p>
              <p className="mt-1 text-2xl font-semibold text-white">{item.min_quantity}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function LowStockPanel() {
  const [report, setReport] = useState<LowStockResponse>({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Checking stock alerts...");

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);
      try {
        const nextReport = await getLowStockReport();
        if (!active) {
          return;
        }
        setReport(nextReport);
        setMessage(nextReport.count === 0 ? "No low stock alerts." : "Low stock needs attention.");
      } catch (error) {
        if (!active) {
          return;
        }
        setMessage(error instanceof Error ? error.message : "Failed to load low stock alerts.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-3">
      <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4 shadow-[0_24px_80px_-50px_rgba(244,63,94,0.55)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-100/80">
              Low Stock
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">Alerts</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-rose-400/15 px-3 py-2 text-sm font-semibold text-rose-100">
            <TriangleAlert className="size-4" />
            {loading ? "..." : report.count}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-rose-50/85">{message}</p>
      </div>

      {loading ? (
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
          Loading alerts...
        </div>
      ) : null}

      {!loading && report.results.length === 0 ? (
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Inventory is above minimum stock levels.
        </div>
      ) : null}

      <div className="space-y-3">
        {report.results.map((item) => (
          <LowStockCard key={item.id} item={item} />
        ))}
      </div>

      <Button
        variant="outline"
        className="h-12 w-full rounded-2xl border-rose-400/20 bg-rose-500/10 text-rose-50 hover:bg-rose-500/15"
        onClick={() => {
          window.location.href = "/products";
        }}
      >
        Review Products
      </Button>
    </section>
  );
}
