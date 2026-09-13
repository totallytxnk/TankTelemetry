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
  const statusConfig = {
    operational: {
      label: "Operational",
      dot: "bg-emerald-400",
      text: "text-emerald-400",
      ring: "ring-emerald-400/20",
    },
    degraded: {
      label: "Degraded",
      dot: "bg-amber-400",
      text: "text-amber-400",
      ring: "ring-amber-400/20",
    },
    down: {
      label: "Down",
      dot: "bg-red-400",
      text: "text-red-400",
      ring: "ring-red-400/20",
    },
  }[stats.status];

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.04] bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "relative flex h-2.5 w-2.5",
                refreshing && "animate-pulse"
              )}
            >
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-40",
                  statusConfig.dot
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full ring-4",
                  statusConfig.dot,
                  statusConfig.ring
                )}
              />
            </span>
            <span className={cn("text-sm font-medium", statusConfig.text)}>
              {statusConfig.label}
            </span>
          </div>

          <div className="hidden h-5 w-px bg-white/[0.06] sm:block" />

          <div className="hidden items-center gap-6 sm:flex">
            <Stat label="Errors" value={formatPercent(stats.errorRate)} />
            <Stat label="Requests" value={formatNumber(stats.totalRequests)} />
            <Stat label="Avg" value={formatMs(stats.avgLatencyMs)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={appId}
            onChange={(e) => onAppIdChange(e.target.value)}
            placeholder="app id"
            className="h-9 w-36 rounded-xl border border-white/[0.06] bg-surface-raised px-3 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-600 transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
          />

          <div className="flex rounded-xl border border-white/[0.06] bg-surface-raised p-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWindowChange(w)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  window === w
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* mobile stats */}
      <div className="flex items-center gap-6 border-t border-white/[0.03] px-5 py-2.5 sm:hidden">
        <Stat label="Errors" value={formatPercent(stats.errorRate)} />
        <Stat label="Requests" value={formatNumber(stats.totalRequests)} />
        <Stat label="Avg" value={formatMs(stats.avgLatencyMs)} />
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-mono text-sm tabular-nums text-zinc-100">
        {value}
      </span>
    </div>
  );
}
