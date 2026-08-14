import { NextRequest, NextResponse } from "next/server";
import { getAggregatedMetrics, checkIntakeHealth } from "@/lib/intake";
import type { TimeWindow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const appId = searchParams.get("app_id") || process.env.DEFAULT_APP_ID || "demo-app";
  const windowParam = (searchParams.get("window") || "5m") as TimeWindow;
  const window: TimeWindow =
    windowParam === "1h" || windowParam === "24h" ? windowParam : "5m";

  const healthy = await checkIntakeHealth();
  const metrics = await getAggregatedMetrics(appId, window);

  let status: "operational" | "degraded" | "down" = "operational";
  if (!healthy) status = "down";
  else if (metrics.errorRate > 0.05) status = "degraded";

  return NextResponse.json({
    ...metrics,
    status,
    appId,
  });
}
