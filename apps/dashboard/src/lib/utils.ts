import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export function windowToMs(window: string): number {
  switch (window) {
    case "5m":
      return 5 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

export function bucketIntervalMs(window: string): number {
  switch (window) {
    case "5m":
      return 15 * 1000;
    case "1h":
      return 2 * 60 * 1000;
    case "24h":
      return 30 * 60 * 1000;
    default:
      return 15 * 1000;
  }
}

export function statusClass(code: number): string {
  if (code >= 200 && code < 300)
    return "border-white/[0.08] text-zinc-200 bg-white/[0.03]";
  if (code >= 400 && code < 500)
    return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  if (code >= 500)
    return "border-red-500/30 text-red-300 bg-red-500/10";
  return "border-white/[0.06] text-zinc-400 bg-white/[0.02]";
}

export function latencyBadgeClass(ms: number): string {
  if (ms < 100) return "border-white/[0.08] text-zinc-200 bg-white/[0.03]";
  if (ms < 500) return "border-white/[0.06] text-zinc-300 bg-white/[0.02]";
  return "border-white/[0.05] text-zinc-500 bg-white/[0.015]";
}
