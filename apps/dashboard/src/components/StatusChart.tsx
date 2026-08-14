"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
      <div className="flex h-72 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
        <p className="text-sm text-neutral-500">Loading status distribution…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
        <p className="text-sm text-neutral-500">No status data for this window</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">HTTP status distribution</h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-200" /> 2xx
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-600 pattern-error" /> 4xx
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-500 pattern-error" /> 5xx
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="window"
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
              allowDecimals={false}
              width={40}
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
            />
            <Legend wrapperStyle={{ display: "none" }} />
            <Bar dataKey="status2xx" name="2xx" stackId="a" fill="#e5e5e5" isAnimationActive={false} />
            <Bar dataKey="status4xx" name="4xx" stackId="a" fill="#525252" isAnimationActive={false} />
            <Bar dataKey="status5xx" name="5xx" stackId="a" fill="#737373" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
