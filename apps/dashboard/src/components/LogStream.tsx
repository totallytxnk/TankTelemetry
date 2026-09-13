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
    <div id="logs" className="card overflow-hidden">
      <div className="card-header !pb-3">
        <div>
          <h3 className="card-title">Requests</h3>
          <p className="card-subtitle mt-0.5">Live request stream</p>
        </div>
        <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-400">
          {rows.length} shown
        </span>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading requests…</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2">
          <p className="text-sm text-zinc-400">Couldn’t load requests</p>
          <p className="font-mono text-xs text-zinc-600">{error}</p>
          <button
            type="button"
            onClick={() => void fetchPage(null, false)}
            className="mt-2 rounded-xl border border-white/[0.08] bg-surface-raised px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.12] hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-zinc-500">No events yet for this app</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-zinc-500">
                      {new Date(row.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-mono text-xs font-medium text-zinc-300">
                        {row.method}
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate px-5 py-2.5 font-mono text-xs text-zinc-200">
                      {row.route}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[11px]",
                          statusClass(row.statusCode)
                        )}
                      >
                        {row.statusCode}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[11px]",
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

          <div className="flex items-center justify-center border-t border-white/[0.04] px-5 py-3">
            {hasMore ? (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchPage(cursor, true)}
                className="rounded-xl border border-white/[0.08] bg-surface-raised px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <span className="text-xs text-zinc-600">End of stream</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
