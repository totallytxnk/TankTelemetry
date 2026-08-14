"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { LatencyPoint } from "@/lib/types";
import { formatMs } from "@/lib/utils";

interface LatencyChartProps {
  data: LatencyPoint[];
  loading?: boolean;
}

function formatTick(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LatencyChart({ data, loading }: LatencyChartProps) {
  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
        <p className="text-sm text-neutral-500">Loading latency series…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
        <p className="text-sm text-neutral-500">No latency data for this window</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Latency percentiles</h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-white" /> p50
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-neutral-400" /> p90
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-neutral-600" /> p99
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              stroke="#525252"
              tick={{ fill: "#737373", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#262626" }}
              minTickGap={40}
            />
            <YAxis
              stroke="#525252"
              tick={{ fill: "#737373", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#262626" }}
              tickFormatter={(v) => formatMs(v)}
              width={56}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0a0a",
                border: "1px solid #262626",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a3a3a3", marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5" }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number, name: string) => [formatMs(value), name.toUpperCase()]}
            />
            <Legend
              wrapperStyle={{ display: "none" }}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="p50"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "#ffffff", stroke: "#000000", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p90"
              name="p90"
              stroke="#a3a3a3"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#a3a3a3", stroke: "#000000", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="p99"
              name="p99"
              stroke="#525252"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: "#525252", stroke: "#000000", strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
