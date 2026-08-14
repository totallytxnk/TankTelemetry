"use client";

import { cn, formatNumber, formatMs, formatPercent } from "@/lib/utils";
import type { HeaderStats, TimeWindow } from "@/lib/types";

interface HeaderProps {
  stats: HeaderStats;
  window: TimeWindow;
  onWindowChange: (w: TimeWindow) => void;
  appId: string;
  onAppIdChange: (id: string) => void;
  refreshing: boolean;
}

const WINDOWS: TimeWindow[] = ["5m", "1h", "24h"];

export function Header({
  stats,
  window,
  onWindowChange,
  appId,
  onAppIdChange,
  refreshing,
}: HeaderProps) {
  const statusLabel =
    stats.status === "operational"
      ? "Operational"
      : stats.status === "degraded"
        ? "Degraded"
        : "Down";

  const statusDot =
    stats.status === "operational"
      ? "bg-white"
      : stats.status === "degraded"
        ? "bg-neutral-400"
        : "bg-neutral-600";

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-black/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", statusDot)} />
            <span className="text-sm font-medium text-white">{statusLabel}</span>
            {refreshing && (
              <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                syncing
              </span>
            )}
          </div>

          <div className="hidden h-4 w-px bg-neutral-800 sm:block" />

          <div className="hidden items-center gap-6 sm:flex">
            <Stat label="Error rate" value={formatPercent(stats.errorRate)} />
            <Stat label="Requests" value={formatNumber(stats.totalRequests)} />
            <Stat label="Avg latency" value={formatMs(stats.avgLatencyMs)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={appId}
            onChange={(e) => onAppIdChange(e.target.value)}
            placeholder="app_id"
            className="h-8 w-36 rounded border border-neutral-800 bg-neutral-950 px-2.5 font-mono text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />

          <div className="flex rounded border border-neutral-800 bg-neutral-950 p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  window === w
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t border-neutral-900 px-6 py-2 sm:hidden">
        <Stat label="Error rate" value={formatPercent(stats.errorRate)} />
        <Stat label="Requests" value={formatNumber(stats.totalRequests)} />
        <Stat label="Avg latency" value={formatMs(stats.avgLatencyMs)} />
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  );
}
