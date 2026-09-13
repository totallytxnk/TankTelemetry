"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LatencyPoint } from "@/lib/types";
import { formatMs } from "@/lib/utils";

interface LatencyChartProps {
  data: LatencyPoint[];
  loading?: boolean;
}

function formatTick(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LatencyChart({ data, loading }: LatencyChartProps) {
  if (loading) {
    return (
      <div className="card flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-500">Loading latency…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-500">No latency data in this window</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="card-title">Latency</h3>
          <p className="card-subtitle mt-0.5">Response time percentiles</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-chart-blue" />
            p50
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-zinc-400" />
            p90
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-zinc-600" />
            p99
          </span>
        </div>
      </div>

      <div className="h-64 w-full px-3 pb-4 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="4 4"
              vertical={false}
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              stroke="transparent"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMs(v)}
              width={52}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#141417",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#a1a1aa", marginBottom: 6 }}
              itemStyle={{ color: "#e4e4e7" }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number, name: string) => [
                formatMs(value),
                name,
              ]}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="p50"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3b82f6",
                stroke: "#0c0c0e",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p90"
              name="p90"
              stroke="#a1a1aa"
              strokeWidth={1.75}
              dot={false}
              activeDot={{
                r: 3.5,
                fill: "#a1a1aa",
                stroke: "#0c0c0e",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p99"
              name="p99"
              stroke="#52525b"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{
                r: 3.5,
                fill: "#52525b",
                stroke: "#0c0c0e",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
