import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../db";
import {
  TelemetryQuerySchema,
  encodeCursor,
  decodeCursor,
} from "../types";

export async function telemetryRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/v1/telemetry",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["app_id"],
          properties: {
            app_id: { type: "string" },
            limit: { type: "string" },
            cursor: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    appId: { type: "string" },
                    route: { type: "string" },
                    method: { type: "string" },
                    statusCode: { type: "integer" },
                    durationMs: { type: "integer" },
                    createdAt: { type: "string" },
                  },
                },
              },
              nextCursor: { type: ["string", "null"] },
              hasMore: { type: "boolean" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = TelemetryQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid query parameters",
          details: parsed.error.flatten(),
        });
      }

      const { app_id: appId, limit, cursor } = parsed.data;

      let cursorFilter: {
        createdAt: Date;
        id: string;
      } | null = null;

      if (cursor) {
        const decoded = decodeCursor(cursor);
        if (!decoded) {
          return reply.status(400).send({ error: "Invalid cursor" });
        }
        cursorFilter = {
          createdAt: new Date(decoded.createdAt),
          id: decoded.id,
        };
      }

      const take = limit + 1;

      const rows = await prisma.telemetryEvent.findMany({
        where: {
          appId,
          ...(cursorFilter
            ? {
                OR: [
                  { createdAt: { lt: cursorFilter.createdAt } },
                  {
                    createdAt: cursorFilter.createdAt,
                    id: { lt: cursorFilter.id },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take,
        select: {
          id: true,
          appId: true,
          route: true,
          method: true,
          statusCode: true,
          durationMs: true,
          createdAt: true,
        },
      });

      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasMore && data.length > 0) {
        const last = data[data.length - 1];
        nextCursor = encodeCursor(last.createdAt, last.id);
      }

      return reply.send({
        data: data.map((row) => ({
          id: row.id,
          appId: row.appId,
          route: row.route,
          method: row.method,
          statusCode: row.statusCode,
          durationMs: row.durationMs,
          createdAt: row.createdAt.toISOString(),
        })),
        nextCursor,
        hasMore,
      });
    }
  );
}
