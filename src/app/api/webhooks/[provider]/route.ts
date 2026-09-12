import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/http";
import { validSignature, webhookRoute, webhookSecret, type WebhookProvider } from "@/lib/api/webhooks";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ provider: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { provider } = await context.params;
  const destination = webhookRoute(provider);
  if (!destination) return fail(404, "UNKNOWN_WEBHOOK_PROVIDER", "Unknown webhook provider.");

  const body = await request.text();
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return fail(400, "INVALID_JSON", "Webhook body must be valid JSON.");
  }

  const secret = webhookSecret(provider as WebhookProvider);
  const signature = request.headers.get("x-omnipulse-signature");
  if (secret && !validSignature(body, signature, secret)) {
    return fail(401, "INVALID_WEBHOOK_SIGNATURE", "Webhook signature verification failed.");
  }
  if (!secret && process.env.NODE_ENV === "production") {
    return fail(503, "WEBHOOK_NOT_CONFIGURED", `No secret is configured for the ${provider} webhook.`);
  }

  return ok({
    accepted: true,
    receiptId: `evt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
    provider,
    destination,
    verification: secret ? "verified" : "mock",
    event,
  }, { status: 202 });
}
