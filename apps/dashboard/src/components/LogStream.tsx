"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TelemetryEvent } from "@/lib/types";
import { cn, formatMs, statusClass, latencyBadgeClass } from "@/lib/utils";

interface LogStreamProps {
  appId: string;
}

export function LogStream({ appId }: LogStreamProps) {
  const [rows, setRows] = useState<TelemetryEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  const fetchPage = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          app_id: appId,
          limit: "40",
        });
        if (nextCursor) params.set("cursor", nextCursor);

        const res = await fetch(`/api/logs?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const body = await res.json();
        const data: TelemetryEvent[] = body.data || [];
        setRows((prev) => (append ? [...prev, ...data] : data));
        setCursor(body.nextCursor ?? null);
        setHasMore(Boolean(body.hasMore));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs");
        if (!append) setRows([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [appId]
  );

  useEffect(() => {
    initialLoad.current = true;
    setRows([]);
    setCursor(null);
    void fetchPage(null, false);
  }, [appId, fetchPage]);

  useEffect(() => {
    if (!initialLoad.current) return;
    initialLoad.current = false;

    const id = setInterval(() => {
      void fetchPage(null, false);
    }, 8000);

    return () => clearInterval(id);
  }, [fetchPage]);

  return (
    <div id="logs" className="rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h3 className="text-sm font-medium text-white">Live request stream</h3>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          {rows.length} shown
        </span>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-neutral-500">Loading logs…</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <p className="text-sm text-neutral-400">Unable to load logs</p>
          <p className="font-mono text-xs text-neutral-600">{error}</p>
          <button
            type="button"
            onClick={() => void fetchPage(null, false)}
            className="mt-2 rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-neutral-500">No events yet for this app</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500">
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Method</th>
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-900 transition-colors hover:bg-neutral-900/50"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-400">
                      {new Date(row.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-neutral-300">
                        {row.method}
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 font-mono text-xs text-neutral-200">
                      {row.route}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px]",
                          statusClass(row.statusCode)
                        )}
                      >
                        {row.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px]",
                          latencyBadgeClass(row.durationMs)
                        )}
                      >
                        {formatMs(row.durationMs)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center border-t border-neutral-800 px-4 py-3">
            {hasMore ? (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchPage(cursor, true)}
                className="rounded border border-neutral-700 bg-black px-4 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <span className="text-xs text-neutral-600">End of stream</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
