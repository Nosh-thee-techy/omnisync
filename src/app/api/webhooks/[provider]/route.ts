import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/http";
import { validSignature, webhookRoute, webhookSecret, type WebhookProvider } from "@/lib/api/webhooks";
import { parseIntent } from "@/lib/api/intent";
import { makeAction, store } from "@/lib/api/store";

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

  const payload = event !== null && typeof event === "object" && !Array.isArray(event)
    ? event as Record<string, unknown>
    : {};
  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : typeof payload.text === "string" ? payload.text.trim() : "";
  const meetingId = typeof payload.meetingId === "string" ? payload.meetingId : undefined;
  if (provider === "transcript" && !transcript) {
    return fail(422, "VALIDATION_ERROR", "Transcript webhooks require a transcript or text field.", { transcript: "Provide a non-empty transcript string." });
  }
  if (meetingId && !store.meetings.has(meetingId)) {
    return fail(422, "VALIDATION_ERROR", "The meeting does not exist.", { meetingId: "Unknown meeting." });
  }

  const intent = provider === "transcript" ? parseIntent(transcript) : undefined;
  const action = intent?.action
    ? makeAction({ meetingId, title: intent.action.title, owner: intent.action.owner, dueAt: intent.action.dueAt, status: "open" })
    : undefined;
  if (action) store.actions.set(action.id, action);

  return ok({
    accepted: true,
    receiptId: `evt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
    provider,
    destination,
    verification: secret ? "verified" : "mock",
    event,
    ...(intent ? { intent } : {}),
    ...(action ? { action } : {}),
  }, { status: 202 });
}
