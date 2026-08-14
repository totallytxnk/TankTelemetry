# TankTelemetry 📡

> High-performance API analytics and real-time telemetry monitoring SaaS.

TankTelemetry is a developer-first platform designed to track live server health, request latency, and HTTP status codes with minimal impact on application performance. Simply drop our lightweight SDK snippet into your backend middleware to visualize metrics, track error distributions, and receive automated incident alerts.

---

## 🚀 Key Features

* **Non-Blocking Middleware SDK:** Lightweight asynchronous wrapper that captures incoming traffic without blocking user requests.
* **High-Throughput Intake:** Built for high concurrency and efficient processing of telemetry event batches.
* **Automated Incident Alerting:** Background cron runners scan error thresholds and trigger downtime notifications via Resend API.
* **Real-Time Dashboard:** Live charts tracking latency, request volume, and status codes.
* **Optimized Storage Pipeline:** Relational data schemas engineered with cursor pagination for efficient telemetry lookups.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Dashboard** | Next.js 15 (App Router), React, Tailwind CSS, Recharts |
| **Ingestion Engine** | Fastify, Express (Node.js) |
| **Database & ORM** | PostgreSQL, Prisma (Cursor Pagination Optimized) |
| **Alerting & Email** | Resend API, Node Cron |

---

## 📁 Workspace Layout

```text
apps/
  intake/        Fastify ingestion + query API + incident monitor (PostgreSQL / Prisma)
  dashboard/     Next.js App Router dashboard (Tailwind + Recharts)
packages/
  sdk/           Node.js middleware (Express / Fastify / generic)
```

---

## 🏗️ Architecture

```text
Application
    │
    ▼
TankTelemetry SDK
    │
    │ async telemetry batch
    ▼
Intake API ───────► PostgreSQL
    │                    │
    │                    └── Cursor-paginated queries
    │
    └── Incident Monitor
             │
             ▼
          Resend
             │
             ▼
       Alert Email

Dashboard ◄──── Intake API
```

---

## ⚡ Quickstart

### 1. Prerequisites

* Node.js >= 20
* PostgreSQL >= 14 (or Docker)
* npm workspaces

### 2. Local Environment Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/totallytxnk/TankTelemetry.git
cd TankTelemetry
npm install
```

Set up your environment variables:

```bash
cp .env.example .env
cp apps/intake/.env.example apps/intake/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

Initialize the database and run the development environment:

```bash
npm run db:generate
npm run db:migrate
npm run build -w @tanktelemetry/sdk
npm run dev
```

* **Dashboard:** http://localhost:3000
* **Intake API:** http://localhost:3001

Run individual services independently:

```bash
npm run dev:intake
npm run dev:dashboard
```

---

## 🐳 Docker Compose

Docker Compose can spin up the full stack alongside PostgreSQL.

```bash
cp .env.example .env
# Set RESEND_API_KEY and ALERT_EMAIL_TO in .env for live alerts

npm run docker:up
npm run docker:logs
```

To stop the containers:

```bash
npm run docker:down
```

---

## 🚨 Incident Monitor

The incident monitor runs inside the intake process on a 60-second cron schedule configured by `ALERT_CRON` (default: `*/1 * * * *`).

### Workflow

1. Loads telemetry events for the last `ALERT_WINDOW_MINUTES` (default: `5` minutes).
2. Groups metrics by `app_id`.
3. Skips apps below `ALERT_MIN_SAMPLE_SIZE` (default: `20` requests).
4. Flags breaches when `5xx error rate > ALERT_ERROR_RATE_THRESHOLD` (default: `0.05`) or `p95 latency > ALERT_P95_LATENCY_MS` (default: `2000ms`).
5. Dispatches an email via Resend containing the `app_id`, current metrics, and top affected routes.
6. Applies an in-memory cooldown (`ALERT_COOLDOWN_MS`, default: `5 minutes`) per app and incident type.

Disable the incident monitor by setting:

```env
INCIDENT_MONITOR_ENABLED=false
```

You can also disable alerting with:

```env
ALERTS_ENABLED=false
```

---

## 🔌 SDK Integration

### Express Middleware

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

### Fastify Plugin

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

---

## 📡 Intake API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/ingest` | Batch event ingestion endpoint |
| `GET` | `/api/v1/telemetry` | Cursor-paginated telemetry query endpoint |
| `GET` | `/health` | Liveness health probe |

---

## 📊 Dashboard

The dashboard features a monochromatic black-and-white minimalist design with:

* **Live Status Header & Metrics Cards:** Overview of system throughput and health.
* **Latency Charts:** Tracking p50, p90, and p99 request latency over time.
* **HTTP Status Distribution:** Visual breakdown of 2xx, 4xx, and 5xx responses.
* **Live Log Stream:** Log inspection backed by cursor-paginated telemetry queries.

---

## 🔐 Security & Privacy

TankTelemetry is designed to collect telemetry rather than application payloads. Before deploying the SDK in production, review exactly which fields are captured and ensure that sensitive information is not sent to the ingestion API.

In particular:

* Do not send passwords, authentication tokens, API keys, request bodies, or other secrets as telemetry fields.
* Avoid collecting personally identifiable information unless it is necessary and appropriately protected.
* Use HTTPS for production ingestion endpoints.
* Protect PostgreSQL credentials and other server-side secrets.
* Never commit `.env` files or real API keys to source control.
* Keep `.env.example` files limited to placeholder values.

---

## ⚙️ Environment Variables Reference

See `.env.example` for the complete configuration reference.

| Environment Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `RESEND_API_KEY` | Resend API key used for incident email notifications |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `ALERT_EMAIL_TO` | Comma-separated incident recipient list |
| `ALERT_ERROR_RATE_THRESHOLD` | 5xx error-rate threshold ratio (`0.00`–`1.00`) |
| `ALERT_P95_LATENCY_MS` | p95 latency trigger threshold in milliseconds |
| `ALERT_WINDOW_MINUTES` | Telemetry lookback window used by the incident monitor |
| `ALERT_MIN_SAMPLE_SIZE` | Minimum number of requests before an app can trigger an incident |
| `ALERT_COOLDOWN_MS` | Cooldown period between repeated incidents |
| `ALERT_CRON` | Cron schedule for the incident monitor |
| `INCIDENT_MONITOR_ENABLED` | Enables or disables the incident monitor |
| `ALERTS_ENABLED` | Enables or disables alert delivery |

---

## 📈 Performance Notes

TankTelemetry is designed around asynchronous telemetry collection so application requests do not need to wait for telemetry ingestion to complete.

Actual overhead and throughput depend on the deployment environment, network conditions, event volume, database configuration, and batching strategy. Benchmark the SDK and ingestion pipeline under your expected production workload before making performance guarantees.

---

## 🧪 Development

Run the dashboard and intake services together:

```bash
npm run dev
```

Or run them independently:

```bash
npm run dev:intake
npm run dev:dashboard
```

Build the SDK:

```bash
npm run build -w @tanktelemetry/sdk
```

---

## 📄 License

TankTelemetry is licensed under the MIT License. See [LICENSE](LICENSE) for details.
