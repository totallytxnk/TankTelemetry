"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "./Header";
import { MetricCards } from "./MetricCards";
import { LatencyChart } from "./LatencyChart";
import { StatusChart } from "./StatusChart";
import { LogStream } from "./LogStream";
import type { AggregatedMetrics, HeaderStats, TimeWindow } from "@/lib/types";

const POLL_MS = 5000;

export function Dashboard() {
  const [window, setWindow] = useState<TimeWindow>("5m");
  const [appId, setAppId] = useState("demo-app");
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [status, setStatus] = useState<HeaderStats["status"]>("operational");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams({
          app_id: appId,
          window,
        });
        const res = await fetch(`/api/metrics?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("metrics fetch failed");
        const body = await res.json();
        setMetrics(body);
        setStatus(body.status || "operational");
      } catch {
        setStatus("down");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appId, window]
  );

  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const headerStats: HeaderStats = {
    status,
    errorRate: metrics?.errorRate ?? 0,
    totalRequests: metrics?.totalRequests ?? 0,
    avgLatencyMs: metrics?.avgLatencyMs ?? 0,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        stats={headerStats}
        window={window}
        onWindowChange={setWindow}
        appId={appId}
        onAppIdChange={setAppId}
        refreshing={refreshing}
      />

      <main className="flex-1 space-y-6 p-6">
        <MetricCards
          totalRequests={metrics?.totalRequests ?? 0}
          errorRate={metrics?.errorRate ?? 0}
          avgLatencyMs={metrics?.avgLatencyMs ?? 0}
          p50={metrics?.p50 ?? 0}
          p90={metrics?.p90 ?? 0}
          p99={metrics?.p99 ?? 0}
          loading={loading && !metrics}
        />

        <div id="latency" className="grid gap-4 lg:grid-cols-1">
          <LatencyChart
            data={metrics?.latencySeries ?? []}
            loading={loading && !metrics}
          />
        </div>

        <div id="status" className="grid gap-4 lg:grid-cols-1">
          <StatusChart
            data={metrics?.statusDistribution ?? []}
            loading={loading && !metrics}
          />
        </div>

        <LogStream appId={appId} />
      </main>
    </div>
  );
}
