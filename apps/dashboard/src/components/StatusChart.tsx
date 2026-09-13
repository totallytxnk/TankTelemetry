"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StatusBucket } from "@/lib/types";

interface StatusChartProps {
  data: StatusBucket[];
  loading?: boolean;
}

function formatTick(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function StatusChart({ data, loading }: StatusChartProps) {
  if (loading) {
    return (
      <div className="card flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-500">Loading status…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-500">No status data in this window</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="card-title">Status codes</h3>
          <p className="card-subtitle mt-0.5">Distribution over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md bg-zinc-200" />
            2xx
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md bg-amber-500/90" />
            4xx
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md bg-red-500/90" />
            5xx
          </span>
        </div>
      </div>

      <div className="h-64 w-full px-3 pb-4 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="4 4"
              vertical={false}
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="window"
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
              allowDecimals={false}
              width={36}
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
            />
            <Bar
              dataKey="status2xx"
              name="2xx"
              stackId="a"
              fill="#e4e4e7"
              isAnimationActive={false}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="status4xx"
              name="4xx"
              stackId="a"
              fill="#f59e0b"
              isAnimationActive={false}
            />
            <Bar
              dataKey="status5xx"
              name="5xx"
              stackId="a"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
