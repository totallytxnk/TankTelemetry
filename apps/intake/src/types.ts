import { z } from "zod";

export const IngestEventSchema = z.object({
  route: z.string().min(1).max(2048),
  method: z.string().min(1).max(16),
  statusCode: z.number().int().min(0).max(599),
  durationMs: z.number().int().min(0).max(3_600_000),
});

export const IngestPayloadSchema = z.object({
  appId: z.string().min(1).max(128),
  events: z.array(IngestEventSchema).min(1).max(500),
});

export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
export type IngestEvent = z.infer<typeof IngestEventSchema>;

export const TelemetryQuerySchema = z.object({
  app_id: z.string().min(1).max(128),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = v === undefined ? 50 : parseInt(v, 10);
      if (Number.isNaN(n) || n < 1) return 50;
      return Math.min(n, 200);
    }),
  cursor: z.string().optional(),
});

export type TelemetryQuery = z.infer<typeof TelemetryQuerySchema>;

export interface CursorPayload {
  createdAt: string;
  id: string;
}

export function encodeCursor(createdAt: Date, id: string): string {
  const payload: CursorPayload = {
    createdAt: createdAt.toISOString(),
    id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as CursorPayload;
    if (
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt))
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
