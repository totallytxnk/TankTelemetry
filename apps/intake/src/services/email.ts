import { Resend } from "resend";

export interface IncidentEmailPayload {
  appId: string;
  incidentType: "error_rate" | "latency";
  errorRate: number;
  p95LatencyMs: number;
  totalRequests: number;
  errorCount: number;
  thresholdErrorRate: number;
  thresholdP95Ms: number;
  windowMinutes: number;
  affectedRoutes: Array<{
    route: string;
    method: string;
    errorCount: number;
    requestCount: number;
    avgLatencyMs: number;
  }>;
  detectedAt: Date;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildIncidentHtml(payload: IncidentEmailPayload): string {
  const title =
    payload.incidentType === "error_rate"
      ? "Error rate threshold breached"
      : "Latency threshold breached";

  const metricRow =
    payload.incidentType === "error_rate"
      ? `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;">Error rate</td>
          <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-family:ui-monospace,monospace;">${formatPercent(payload.errorRate)} (threshold ${formatPercent(payload.thresholdErrorRate)})</td>
        </tr>`
      : `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;">p95 latency</td>
          <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-family:ui-monospace,monospace;">${Math.round(payload.p95LatencyMs)}ms (threshold ${payload.thresholdP95Ms}ms)</td>
        </tr>`;

  const routeRows =
    payload.affectedRoutes.length === 0
      ? `<tr><td colspan="4" style="padding:12px;color:#737373;text-align:center;">No route breakdown available</td></tr>`
      : payload.affectedRoutes
          .map(
            (r) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#e5e5e5;font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(r.method)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#e5e5e5;font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(r.route)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#e5e5e5;font-family:ui-monospace,monospace;font-size:12px;text-align:right;">${r.errorCount}/${r.requestCount}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#e5e5e5;font-family:ui-monospace,monospace;font-size:12px;text-align:right;">${Math.round(r.avgLatencyMs)}ms</td>
          </tr>`
          )
          .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TankTelemetry Incident</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#0a0a0a;border:1px solid #262626;border-radius:8px;">
          <tr>
            <td style="padding:24px 24px 16px;border-bottom:1px solid #262626;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;">TankTelemetry</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #262626;border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;">App ID</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-family:ui-monospace,monospace;">${escapeHtml(payload.appId)}</td>
                </tr>
                ${metricRow}
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;">Requests in window</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-family:ui-monospace,monospace;">${payload.totalRequests} (${payload.errorCount} errors)</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;">Window</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-family:ui-monospace,monospace;">Last ${payload.windowMinutes} minutes</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;color:#a3a3a3;">Detected at</td>
                  <td style="padding:8px 12px;color:#ffffff;font-family:ui-monospace,monospace;">${payload.detectedAt.toISOString()}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#737373;">Affected routes</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #262626;border-radius:6px;overflow:hidden;">
                <tr style="background-color:#171717;">
                  <th align="left" style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373;font-weight:500;">Method</th>
                  <th align="left" style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373;font-weight:500;">Route</th>
                  <th align="right" style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373;font-weight:500;">Errors</th>
                  <th align="right" style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#737373;font-weight:500;">Avg lat</th>
                </tr>
                ${routeRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:11px;color:#525252;">This alert was generated automatically by the TankTelemetry incident monitor. Cooldown applies to limit notification noise.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export class EmailService {
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly to: string[];
  private readonly enabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || "";
    const from = process.env.RESEND_FROM_EMAIL || "alerts@tanktelemetry.local";
    const toRaw = process.env.ALERT_EMAIL_TO || "";
    this.to = toRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    this.from = from;
    this.enabled =
      Boolean(apiKey) &&
      this.to.length > 0 &&
      process.env.ALERTS_ENABLED !== "false";

    this.resend = this.enabled ? new Resend(apiKey) : null;
  }

  isEnabled(): boolean {
    return this.enabled && this.resend !== null;
  }

  async sendIncidentAlert(payload: IncidentEmailPayload): Promise<boolean> {
    if (!this.resend || !this.enabled) {
      return false;
    }

    const subject =
      payload.incidentType === "error_rate"
        ? `[TankTelemetry] Error rate spike on ${payload.appId}`
        : `[TankTelemetry] Latency spike on ${payload.appId}`;

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to: this.to,
        subject,
        html: buildIncidentHtml(payload),
      });

      if (result.error) {
        console.error("[alerts] Resend error:", result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[alerts] Failed to send email:", err);
      return false;
    }
  }
}

export const emailService = new EmailService();
