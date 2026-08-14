export interface TelemetryEvent {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
}

export interface TankTelemetryOptions {
  /**
   * Unique application identifier sent with every batch.
   */
  appId: string;

  /**
   * Base URL of the TankTelemetry ingestion server.
   * Defaults to http://localhost:3001.
   */
  ingestionUrl?: string;

  /**
   * Maximum number of events held in memory before a flush is forced.
   * Defaults to 50.
   */
  batchSize?: number;

  /**
   * Maximum time (ms) an event may wait in the buffer before being flushed.
   * Defaults to 5000.
   */
  flushIntervalMs?: number;

  /**
   * Optional custom fetch implementation (useful for testing or undici).
   */
  fetch?: typeof globalThis.fetch;

  /**
   * When true, console.error is called for failed flushes.
   * Defaults to false so production traffic is never interrupted.
   */
  debug?: boolean;
}

interface InternalEvent extends TelemetryEvent {
  enqueuedAt: number;
}

/**
 * Core batching client used by every framework adapter.
 * All network I/O is fire-and-forget; failures never reject or throw
 * into the request lifecycle.
 */
class TelemetryClient {
  private readonly appId: string;
  private readonly endpoint: string;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly debug: boolean;

  private buffer: InternalEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private closed = false;

  constructor(options: TankTelemetryOptions) {
    if (!options.appId || typeof options.appId !== "string") {
      throw new Error("TankTelemetry: appId is required and must be a non-empty string");
    }

    this.appId = options.appId;
    this.endpoint = `${(options.ingestionUrl ?? "http://localhost:3001").replace(/\/$/, "")}/api/v1/ingest`;
    this.batchSize = options.batchSize ?? 50;
    this.flushIntervalMs = options.flushIntervalMs ?? 5000;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.debug = options.debug ?? false;

    if (typeof this.fetchImpl !== "function") {
      throw new Error("TankTelemetry: a fetch implementation is required (Node 18+ or polyfill)");
    }
  }

  /**
   * Enqueue a single telemetry event. Never throws.
   */
  track(event: TelemetryEvent): void {
    if (this.closed) return;

    try {
      this.buffer.push({
        ...event,
        enqueuedAt: Date.now(),
      });

      if (this.buffer.length >= this.batchSize) {
        this.scheduleFlush(0);
      } else if (this.timer === null) {
        this.scheduleFlush(this.flushIntervalMs);
      }
    } catch {
      /* intentionally empty – telemetry must never affect the host application */
    }
  }

  /**
   * Force an immediate flush. Safe to call concurrently.
   */
  async flush(): Promise<void> {
    if (this.closed || this.buffer.length === 0 || this.flushing) return;

    this.flushing = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      const payload = {
        appId: this.appId,
        events: batch.map(({ route, method, statusCode, durationMs }) => ({
          route,
          method,
          statusCode,
          durationMs,
        })),
      };

      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok && this.debug) {
        const text = await response.text().catch(() => "");
        console.error(
          `[TankTelemetry] ingest failed ${response.status}: ${text.slice(0, 200)}`
        );
      }
    } catch (err) {
      if (this.debug) {
        console.error("[TankTelemetry] ingest error:", err);
      }
    } finally {
      this.flushing = false;

      if (this.buffer.length > 0 && !this.closed) {
        this.scheduleFlush(this.buffer.length >= this.batchSize ? 0 : this.flushIntervalMs);
      }
    }
  }

  private scheduleFlush(delayMs: number): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
    if (typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }

  /**
   * Drain remaining events and stop accepting new ones.
   * Call this from process shutdown hooks if desired.
   */
  async close(): Promise<void> {
    this.closed = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

/**
 * Express / Connect compatible middleware factory.
 *
 * Usage:
 *   app.use(createExpressMiddleware({ appId: "my-service" }));
 */
export function createExpressMiddleware(options: TankTelemetryOptions) {
  const client = new TelemetryClient(options);

  const middleware = function tankTelemetryMiddleware(
    req: any,
    res: any,
    next: (err?: any) => void
  ) {
    const start = process.hrtime.bigint();

    const onFinish = () => {
      res.removeListener("finish", onFinish);
      res.removeListener("close", onFinish);

      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Math.round(Number(durationNs) / 1_000_000);

      const route =
        (req.route && req.route.path) ||
        (req.baseUrl ? `${req.baseUrl}${req.path}` : req.path) ||
        req.url?.split("?")[0] ||
        "unknown";

      client.track({
        route: String(route),
        method: String(req.method || "GET").toUpperCase(),
        statusCode: Number(res.statusCode) || 0,
        durationMs,
      });
    };

    res.on("finish", onFinish);
    res.on("close", onFinish);

    next();
  };

  (middleware as any).client = client;
  return middleware;
}

/**
 * Fastify plugin that registers an onResponse hook.
 *
 * Usage:
 *   await fastify.register(createFastifyPlugin({ appId: "my-service" }));
 */
export function createFastifyPlugin(options: TankTelemetryOptions) {
  const client = new TelemetryClient(options);

  async function plugin(fastify: any, _opts: any) {
    fastify.addHook("onResponse", async (request: any, reply: any) => {
      const durationMs =
        typeof reply.getResponseTime === "function"
          ? Math.round(reply.getResponseTime())
          : Math.round(
              Number(
                process.hrtime.bigint() -
                  (request.startTime ?? process.hrtime.bigint())
              ) / 1_000_000
            );

      const route =
        request.routeOptions?.url ||
        request.routerPath ||
        request.url?.split("?")[0] ||
        "unknown";

      client.track({
        route: String(route),
        method: String(request.method || "GET").toUpperCase(),
        statusCode: Number(reply.statusCode) || 0,
        durationMs,
      });
    });

    fastify.decorate("tankTelemetry", client);
  }

  (plugin as any)[Symbol.for("skip-override")] = true;
  (plugin as any).client = client;

  return plugin;
}

/**
 * Low-level helper for frameworks that are neither Express nor Fastify.
 * Returns the shared client so the caller can invoke track() itself.
 */
export function createClient(options: TankTelemetryOptions): {
  track: (event: TelemetryEvent) => void;
  flush: () => Promise<void>;
  close: () => Promise<void>;
} {
  const client = new TelemetryClient(options);
  return {
    track: (event) => client.track(event),
    flush: () => client.flush(),
    close: () => client.close(),
  };
}

export { TelemetryClient };
export default {
  createExpressMiddleware,
  createFastifyPlugin,
  createClient,
};
