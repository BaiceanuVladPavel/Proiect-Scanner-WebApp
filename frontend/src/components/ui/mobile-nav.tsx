"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Boxes, History, ScanLine } from "lucide-react";

const NAV_ITEMS = [
  { href: "/scan" as Route, label: "Scan", icon: ScanLine },
  { href: "/products" as Route, label: "Products", icon: Boxes },
  { href: "/history" as Route, label: "History", icon: History },
];

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between rounded-[28px] border border-white/10 bg-slate-950/78 px-3 py-2 shadow-[0_24px_80px_-28px_rgba(8,15,30,0.95)] backdrop-blur-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-tap flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-cyan-400 text-slate-950 shadow-[0_16px_40px_-24px_rgba(34,211,238,0.85)]"
                  : "text-slate-300 hover:bg-white/6 hover:text-white"
              }`}
            >
              <Icon className="size-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
