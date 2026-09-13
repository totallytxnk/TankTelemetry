import cron from "node-cron";
import { prisma } from "../db";
import { emailService, type IncidentEmailPayload } from "../services/email";

export interface MonitorConfig {
  errorRateThreshold: number;
  p95LatencyThresholdMs: number;
  windowMinutes: number;
  minSampleSize: number;
  cooldownMs: number;
  cronExpression: string;
}

function loadConfig(): MonitorConfig {
  return {
    errorRateThreshold: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || "0.05"),
    p95LatencyThresholdMs: parseInt(process.env.ALERT_P95_LATENCY_MS || "2000", 10),
    windowMinutes: parseInt(process.env.ALERT_WINDOW_MINUTES || "5", 10),
    minSampleSize: parseInt(process.env.ALERT_MIN_SAMPLE_SIZE || "20", 10),
    cooldownMs: parseInt(process.env.ALERT_COOLDOWN_MS || "300000", 10),
    cronExpression: process.env.ALERT_CRON || "*/1 * * * *",
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

interface AppSnapshot {
  appId: string;
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  p95LatencyMs: number;
  routes: Array<{
    route: string;
    method: string;
    errorCount: number;
    requestCount: number;
    avgLatencyMs: number;
  }>;
}

const lastAlertAt = new Map<string, number>();

async function collectSnapshots(windowMinutes: number): Promise<AppSnapshot[]> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const events = await prisma.telemetryEvent.findMany({
    where: { createdAt: { gte: since } },
    select: {
      appId: true,
      route: true,
      method: true,
      statusCode: true,
      durationMs: true,
    },
  });

  const byApp = new Map<
    string,
    {
      durations: number[];
      errorCount: number;
      routeMap: Map<
        string,
        { method: string; route: string; errors: number; count: number; latencySum: number }
      >;
    }
  >();

  for (const ev of events) {
    let bucket = byApp.get(ev.appId);
    if (!bucket) {
      bucket = { durations: [], errorCount: 0, routeMap: new Map() };
      byApp.set(ev.appId, bucket);
    }
    bucket.durations.push(ev.durationMs);
    const isError = ev.statusCode >= 500;
    if (isError) bucket.errorCount += 1;

    const routeKey = `${ev.method} ${ev.route}`;
    let routeStats = bucket.routeMap.get(routeKey);
    if (!routeStats) {
      routeStats = {
        method: ev.method,
        route: ev.route,
        errors: 0,
        count: 0,
        latencySum: 0,
      };
      bucket.routeMap.set(routeKey, routeStats);
    }
    routeStats.count += 1;
    routeStats.latencySum += ev.durationMs;
    if (isError) routeStats.errors += 1;
  }

  const snapshots: AppSnapshot[] = [];

  for (const [appId, bucket] of byApp) {
    const sorted = [...bucket.durations].sort((a, b) => a - b);
    const totalRequests = sorted.length;
    const errorRate = totalRequests === 0 ? 0 : bucket.errorCount / totalRequests;
    const p95LatencyMs = percentile(sorted, 95);

    const routes = Array.from(bucket.routeMap.values())
      .map((r) => ({
        route: r.route,
        method: r.method,
        errorCount: r.errors,
        requestCount: r.count,
        avgLatencyMs: r.count === 0 ? 0 : r.latencySum / r.count,
      }))
      .sort((a, b) => b.errorCount - a.errorCount || b.avgLatencyMs - a.avgLatencyMs)
      .slice(0, 10);

    snapshots.push({
      appId,
      totalRequests,
      errorCount: bucket.errorCount,
      errorRate,
      p95LatencyMs,
      routes,
    });
  }

  return snapshots;
}

function cooldownKey(appId: string, type: string): string {
  return `${appId}:${type}`;
}

function isInCooldown(key: string, cooldownMs: number): boolean {
  const last = lastAlertAt.get(key);
  if (last === undefined) return false;
  return Date.now() - last < cooldownMs;
}

function markAlerted(key: string): void {
  lastAlertAt.set(key, Date.now());
}

async function evaluateAndAlert(config: MonitorConfig): Promise<void> {
  let snapshots: AppSnapshot[];
  try {
    snapshots = await collectSnapshots(config.windowMinutes);
  } catch (err) {
    console.error("[incident-monitor] query failed:", err);
    return;
  }

  const detectedAt = new Date();

  for (const snap of snapshots) {
    if (snap.totalRequests < config.minSampleSize) continue;

    const breaches: Array<"error_rate" | "latency"> = [];

    if (snap.errorRate > config.errorRateThreshold) {
      breaches.push("error_rate");
    }
    if (snap.p95LatencyMs > config.p95LatencyThresholdMs) {
      breaches.push("latency");
    }

    for (const incidentType of breaches) {
      const key = cooldownKey(snap.appId, incidentType);
      if (isInCooldown(key, config.cooldownMs)) continue;

      const payload: IncidentEmailPayload = {
        appId: snap.appId,
        incidentType,
        errorRate: snap.errorRate,
        p95LatencyMs: snap.p95LatencyMs,
        totalRequests: snap.totalRequests,
        errorCount: snap.errorCount,
        thresholdErrorRate: config.errorRateThreshold,
        thresholdP95Ms: config.p95LatencyThresholdMs,
        windowMinutes: config.windowMinutes,
        affectedRoutes: snap.routes,
        detectedAt,
      };

      console.log(
        `[incident-monitor] breach app=${snap.appId} type=${incidentType} errorRate=${(snap.errorRate * 100).toFixed(2)}% p95=${Math.round(snap.p95LatencyMs)}ms`
      );

      if (emailService.isEnabled()) {
        const sent = await emailService.sendIncidentAlert(payload);
        if (sent) {
          markAlerted(key);
          console.log(`[incident-monitor] alert email sent for ${key}`);
        } else {
          console.error(`[incident-monitor] alert email failed for ${key}`);
        }
      } else {
        markAlerted(key);
        console.log(
          `[incident-monitor] alerts disabled or misconfigured; recorded cooldown for ${key}`
        );
      }
    }
  }
}

let task: ReturnType<typeof cron.schedule> | null = null;

export function startIncidentMonitor(): void {
  if (process.env.INCIDENT_MONITOR_ENABLED === "false") {
    console.log("[incident-monitor] disabled via INCIDENT_MONITOR_ENABLED=false");
    return;
  }

  const config = loadConfig();

  if (!cron.validate(config.cronExpression)) {
    console.error(
      `[incident-monitor] invalid cron expression: ${config.cronExpression}`
    );
    return;
  }

  task = cron.schedule(config.cronExpression, () => {
    void evaluateAndAlert(config);
  });

  console.log(
    `[incident-monitor] started cron="${config.cronExpression}" window=${config.windowMinutes}m errorRate>${config.errorRateThreshold} p95>${config.p95LatencyThresholdMs}ms`
  );

  void evaluateAndAlert(config);
}

export function stopIncidentMonitor(): void {
  if (task) {
    task.stop();
    task = null;
    console.log("[incident-monitor] stopped");
  }
}
