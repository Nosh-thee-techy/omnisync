import { createHmac, timingSafeEqual } from "node:crypto";

const routes = {
  calendar: "meetings",
  meeting: "meetings",
  transcript: "actions",
  action: "actions",
} as const;

export type WebhookProvider = keyof typeof routes;

export function webhookRoute(provider: string) {
  return routes[provider as WebhookProvider];
}

export function webhookSecret(provider: WebhookProvider) {
  return process.env[`OMNIPULSE_WEBHOOK_${provider.toUpperCase()}_SECRET`];
}

export function validSignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const received = signature.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
