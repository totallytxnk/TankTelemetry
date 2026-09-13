export type TimeWindow = "5m" | "1h" | "24h";

export interface TelemetryEvent {
  id: string;
  appId: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
}

export interface LatencyPoint {
  timestamp: string;
  p50: number;
  p90: number;
  p99: number;
  count: number;
}

export interface StatusBucket {
  window: string;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  other: number;
}

export interface AggregatedMetrics {
  window: TimeWindow;
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  p50: number;
  p90: number;
  p99: number;
  latencySeries: LatencyPoint[];
  statusDistribution: StatusBucket[];
  statusTotals: {
    status2xx: number;
    status4xx: number;
    status5xx: number;
    other: number;
  };
  generatedAt: string;
}

export interface LogsResponse {
  data: TelemetryEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface HeaderStats {
  status: "operational" | "degraded" | "down";
  errorRate: number;
  totalRequests: number;
  avgLatencyMs: number;
}
