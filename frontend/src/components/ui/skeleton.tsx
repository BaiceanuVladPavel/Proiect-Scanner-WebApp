import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(110deg,rgba(148,163,184,0.08),rgba(148,163,184,0.16),rgba(148,163,184,0.08))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
