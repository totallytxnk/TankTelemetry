import type { TelemetryEvent, LogsResponse } from "./types";
import { windowToMs, bucketIntervalMs, percentile } from "./utils";
import type { AggregatedMetrics, LatencyPoint, StatusBucket, TimeWindow } from "./types";

const INTAKE_URL = process.env.INTAKE_URL || "http://localhost:3001";
const DEFAULT_APP_ID = process.env.DEFAULT_APP_ID || "demo-app";

async function fetchAllEvents(
  appId: string,
  since: Date,
  maxPages = 20
): Promise<TelemetryEvent[]> {
  const events: TelemetryEvent[] = [];
  let cursor: string | null = null;
  let pages = 0;

  while (pages < maxPages) {
    const params = new URLSearchParams({
      app_id: appId,
      limit: "200",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${INTAKE_URL}/api/v1/telemetry?${params.toString()}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      break;
    }

    const body = (await res.json()) as LogsResponse;
    if (!body.data || body.data.length === 0) break;

    for (const ev of body.data) {
      if (new Date(ev.createdAt) >= since) {
        events.push(ev);
      }
    }

    const oldest = body.data[body.data.length - 1];
    if (!body.hasMore || !body.nextCursor || new Date(oldest.createdAt) < since) {
      break;
    }

    cursor = body.nextCursor;
    pages += 1;
  }

  return events;
}

export async function getAggregatedMetrics(
  appId: string = DEFAULT_APP_ID,
  window: TimeWindow = "5m"
): Promise<AggregatedMetrics> {
  const now = Date.now();
  const windowMs = windowToMs(window);
  const since = new Date(now - windowMs);
  const interval = bucketIntervalMs(window);

  let events: TelemetryEvent[] = [];
  try {
    events = await fetchAllEvents(appId, since);
  } catch {
    events = [];
  }

  const durations = events.map((e) => e.durationMs).sort((a, b) => a - b);
  const totalRequests = events.length;
  const errorCount = events.filter((e) => e.statusCode >= 400).length;
  const errorRate = totalRequests === 0 ? 0 : errorCount / totalRequests;
  const avgLatencyMs =
    totalRequests === 0
      ? 0
      : events.reduce((sum, e) => sum + e.durationMs, 0) / totalRequests;

  const p50 = percentile(durations, 50);
  const p90 = percentile(durations, 90);
  const p99 = percentile(durations, 99);

  const bucketCount = Math.ceil(windowMs / interval);
  const latencySeries: LatencyPoint[] = [];
  const statusBuckets: StatusBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = now - windowMs + i * interval;
    const bucketEnd = bucketStart + interval;
    const bucketEvents = events.filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t >= bucketStart && t < bucketEnd;
    });

    const sorted = bucketEvents.map((e) => e.durationMs).sort((a, b) => a - b);
    latencySeries.push({
      timestamp: new Date(bucketStart).toISOString(),
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p99: percentile(sorted, 99),
      count: bucketEvents.length,
    });

    let status2xx = 0;
    let status4xx = 0;
    let status5xx = 0;
    let other = 0;
    for (const e of bucketEvents) {
      if (e.statusCode >= 200 && e.statusCode < 300) status2xx += 1;
      else if (e.statusCode >= 400 && e.statusCode < 500) status4xx += 1;
      else if (e.statusCode >= 500) status5xx += 1;
      else other += 1;
    }

    statusBuckets.push({
      window: new Date(bucketStart).toISOString(),
      status2xx,
      status4xx,
      status5xx,
      other,
    });
  }

  const statusTotals = {
    status2xx: events.filter((e) => e.statusCode >= 200 && e.statusCode < 300).length,
    status4xx: events.filter((e) => e.statusCode >= 400 && e.statusCode < 500).length,
    status5xx: events.filter((e) => e.statusCode >= 500).length,
    other: events.filter(
      (e) =>
        !(e.statusCode >= 200 && e.statusCode < 300) &&
        !(e.statusCode >= 400)
    ).length,
  };

  return {
    window,
    totalRequests,
    errorRate,
    avgLatencyMs,
    p50,
    p90,
    p99,
    latencySeries,
    statusDistribution: statusBuckets,
    statusTotals,
    generatedAt: new Date().toISOString(),
  };
}

export async function getLogsPage(
  appId: string = DEFAULT_APP_ID,
  limit = 50,
  cursor?: string | null
): Promise<LogsResponse> {
  const params = new URLSearchParams({
    app_id: appId,
    limit: String(Math.min(Math.max(limit, 1), 200)),
  });
  if (cursor) params.set("cursor", cursor);

  try {
    const res = await fetch(`${INTAKE_URL}/api/v1/telemetry?${params.toString()}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    return (await res.json()) as LogsResponse;
  } catch {
    return { data: [], nextCursor: null, hasMore: false };
  }
}

export async function checkIntakeHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${INTAKE_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export { DEFAULT_APP_ID, INTAKE_URL };
