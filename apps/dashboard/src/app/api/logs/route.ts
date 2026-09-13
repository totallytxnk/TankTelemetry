import { NextRequest, NextResponse } from "next/server";
import { getLogsPage } from "@/lib/intake";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const appId = searchParams.get("app_id") || process.env.DEFAULT_APP_ID || "demo-app";
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const cursor = searchParams.get("cursor");

  const result = await getLogsPage(appId, limit, cursor);

  return NextResponse.json(result);
}
