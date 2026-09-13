"use client";

import { formatNumber, formatMs, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetricCardsProps {
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  p50: number;
  p90: number;
  p99: number;
  loading?: boolean;
}

export function MetricCards({
  totalRequests,
  errorRate,
  avgLatencyMs,
  p50,
  p90,
  p99,
  loading,
}: MetricCardsProps) {
  const cards = [
    {
      label: "Requests",
      value: loading ? "—" : formatNumber(totalRequests),
      accent: false,
    },
    {
      label: "Error rate",
      value: loading ? "—" : formatPercent(errorRate),
      accent: true,
      warn: errorRate > 0.05,
    },
    {
      label: "Avg latency",
      value: loading ? "—" : formatMs(avgLatencyMs),
      accent: false,
    },
    {
      label: "p50",
      value: loading ? "—" : formatMs(p50),
      accent: false,
    },
    {
      label: "p90",
      value: loading ? "—" : formatMs(p90),
      accent: false,
    },
    {
      label: "p99",
      value: loading ? "—" : formatMs(p99),
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "rounded-2xl border border-white/[0.04] px-4 py-4 transition-shadow duration-200",
            c.accent
              ? "bg-surface-overlay shadow-card"
              : "bg-surface-raised"
          )}
        >
          <p className="text-xs font-medium text-zinc-500">{c.label}</p>
          <p
            className={cn(
              "mt-1.5 font-mono text-xl tabular-nums tracking-tight",
              c.warn ? "text-amber-400" : "text-zinc-50"
            )}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
