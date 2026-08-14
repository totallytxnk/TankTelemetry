# TankTelemetry 📡

> High-performance API analytics and real-time telemetry monitoring SaaS.

TankTelemetry is a developer-first platform designed to track live server health, request latency, and HTTP status codes with zero impact on application performance. Simply drop our lightweight SDK snippet into your backend middleware to visualize metrics, track error distributions, and receive automated incident alerts.

---

## Workspace Layout
...
apps/
  intake/       Fastify ingestion + query API + incident monitor (PostgreSQL / Prisma)
  dashboard/    Next.js App Router dashboard (Tailwind + Recharts)
packages/
  sdk/          Node.js middleware (Express / Fastify / generic)
```

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14 (or Docker)
- npm workspaces
- Optional: Resend API key for email alerts

## Local development

```bash
cp .env.example .env
cp apps/intake/.env.example apps/intake/.env
cp apps/dashboard/.env.example apps/dashboard/.env

npm install
npm run db:generate
npm run db:migrate
npm run build -w @tanktelemetry/sdk
npm run dev
```

- Dashboard: http://localhost:3000
- Intake API: http://localhost:3001

Individual services:

```bash
npm run dev:intake
npm run dev:dashboard
```

## Docker Compose

```bash
cp .env.example .env
# set RESEND_API_KEY and ALERT_EMAIL_TO for live alerts

npm run docker:up
npm run docker:logs
```

Stops with `npm run docker:down`.

## Incident monitor

Runs inside the intake process on a 60-second cron (`ALERT_CRON=*/1 * * * *`).

Every tick it:

1. Loads telemetry events for the last `ALERT_WINDOW_MINUTES` (default 5)
2. Groups by `app_id`
3. Skips apps below `ALERT_MIN_SAMPLE_SIZE` (default 20)
4. Flags breaches when 5xx error rate > `ALERT_ERROR_RATE_THRESHOLD` (default 0.05) or p95 latency > `ALERT_P95_LATENCY_MS` (default 2000)
5. Sends a Resend email with app id, metrics, and top affected routes
6. Applies an in-memory cooldown (`ALERT_COOLDOWN_MS`, default 5 minutes) per app + incident type

Disable with `INCIDENT_MONITOR_ENABLED=false` or `ALERTS_ENABLED=false`.

## SDK usage

### Express

```ts
import express from "express";
import { createExpressMiddleware } from "@tanktelemetry/sdk";

const app = express();
app.use(
  createExpressMiddleware({
    appId: "my-service",
    ingestionUrl: "http://localhost:3001",
  })
);
```

### Fastify

```ts
import Fastify from "fastify";
import { createFastifyPlugin } from "@tanktelemetry/sdk";

const fastify = Fastify();
await fastify.register(
  createFastifyPlugin({
    appId: "my-service",
    ingestionUrl: "http://localhost:3001",
  })
);
```

## Intake API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/ingest | Batch event ingestion |
| GET | /api/v1/telemetry | Cursor-paginated event query |
| GET | /health | Liveness probe |

## Dashboard

Monochromatic black / white / neutral UI with:

- Live status header and metric cards
- p50 / p90 / p99 latency line chart
- Stacked HTTP status distribution
- Cursor-paginated live log stream

## Environment reference

See `.env.example` for the full list. Critical keys:

| Key | Purpose |
|-----|---------|
| DATABASE_URL | PostgreSQL connection string |
| RESEND_API_KEY | Resend API key for incident emails |
| RESEND_FROM_EMAIL | Verified sender address |
| ALERT_EMAIL_TO | Comma-separated recipient list |
| ALERT_ERROR_RATE_THRESHOLD | 5xx rate threshold (0–1) |
| ALERT_P95_LATENCY_MS | p95 latency threshold in ms |
