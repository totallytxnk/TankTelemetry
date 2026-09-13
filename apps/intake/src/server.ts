import Fastify from "fastify";
import cors from "@fastify/cors";
import { ingestRoutes } from "./routes/ingest";
import { telemetryRoutes } from "./routes/telemetry";
import { prisma } from "./db";
import {
  startIncidentMonitor,
  stopIncidentMonitor,
} from "./worker/incident-monitor";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
    bodyLimit: 1_048_576,
    requestTimeout: 15_000,
  });

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  await fastify.register(ingestRoutes);
  await fastify.register(telemetryRoutes);

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? "Internal Server Error" : error.message,
    });
  });

  return fastify;
}

async function main() {
  const server = await buildServer();

  const shutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down`);
    try {
      stopIncidentMonitor();
      await server.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`TankTelemetry intake listening on ${HOST}:${PORT}`);
    startIncidentMonitor();
  } catch (err) {
    server.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void main();
