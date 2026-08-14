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
  if (code >= 200 && code < 300) return "border-neutral-400 text-neutral-200 bg-neutral-900";
  if (code >= 400 && code < 500) return "border-neutral-600 text-neutral-300 bg-neutral-950 pattern-error";
  if (code >= 500) return "border-neutral-500 text-white bg-neutral-800 pattern-error";
  return "border-neutral-700 text-neutral-400 bg-neutral-950";
}

export function latencyBadgeClass(ms: number): string {
  if (ms < 100) return "border-neutral-500 text-neutral-200";
  if (ms < 500) return "border-neutral-600 text-neutral-300";
  return "border-neutral-700 text-neutral-400";
}
