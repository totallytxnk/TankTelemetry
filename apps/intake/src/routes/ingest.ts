import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../db";
import { IngestPayloadSchema } from "../types";

export async function ingestRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/api/v1/ingest",
    {
      schema: {
        body: {
          type: "object",
          required: ["appId", "events"],
          properties: {
            appId: { type: "string" },
            events: {
              type: "array",
              items: {
                type: "object",
                required: ["route", "method", "statusCode", "durationMs"],
                properties: {
                  route: { type: "string" },
                  method: { type: "string" },
                  statusCode: { type: "integer" },
                  durationMs: { type: "integer" },
                },
              },
            },
          },
        },
        response: {
          202: {
            type: "object",
            properties: {
              accepted: { type: "integer" },
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
      const parsed = IngestPayloadSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid payload",
          details: parsed.error.flatten(),
        });
      }

      const { appId, events } = parsed.data;

      const rows = events.map((e) => ({
        appId,
        route: e.route,
        method: e.method.toUpperCase(),
        statusCode: e.statusCode,
        durationMs: e.durationMs,
      }));

      await prisma.telemetryEvent.createMany({
        data: rows,
        skipDuplicates: true,
      });

      return reply.status(202).send({ accepted: rows.length });
    }
  );
}
