"use client";

import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { subscribeToToasts, type ToastDetail } from "@/lib/toast";

type ToastItem = ToastDetail & { id: string };

function toneStyles(tone: ToastDetail["tone"]) {
  if (tone === "success") {
    return {
      icon: <CheckCircle2 className="size-4 text-emerald-200" />,
      className: "border-emerald-400/25 bg-emerald-400/10",
    };
  }

  if (tone === "error") {
    return {
      icon: <AlertCircle className="size-4 text-rose-200" />,
      className: "border-rose-400/25 bg-rose-400/10",
    };
  }

  return {
    icon: <Sparkles className="size-4 text-cyan-200" />,
    className: "border-cyan-400/25 bg-cyan-400/10",
  };
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return subscribeToToasts((detail) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { ...detail, id }].slice(-3));

      const timerId = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        timersRef.current.delete(id);
      }, 2200);

      timersRef.current.set(id, timerId);
    });
  }, []);

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {toasts.map((toast) => {
        const tone = toneStyles(toast.tone);

        return (
          <div
            key={toast.id}
            className={`toast-slide-in pointer-events-none mx-auto flex w-full max-w-sm items-start gap-3 rounded-[24px] border px-4 py-3 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)] backdrop-blur-xl ${tone.className}`}
          >
            <div className="mt-0.5">{tone.icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-slate-200/85">{toast.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
