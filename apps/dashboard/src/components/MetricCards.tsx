"use client";

import { formatNumber, formatMs, formatPercent } from "@/lib/utils";

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
    { label: "Total requests", value: loading ? "—" : formatNumber(totalRequests) },
    { label: "Error rate", value: loading ? "—" : formatPercent(errorRate) },
    { label: "Avg latency", value: loading ? "—" : formatMs(avgLatencyMs) },
    { label: "p50", value: loading ? "—" : formatMs(p50) },
    { label: "p90", value: loading ? "—" : formatMs(p90) },
    { label: "p99", value: loading ? "—" : formatMs(p99) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">
            {c.label}
          </p>
          <p className="mt-1 font-mono text-lg text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
