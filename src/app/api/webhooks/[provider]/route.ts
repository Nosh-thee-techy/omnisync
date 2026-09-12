import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/http";
import {
  extractTranscriptEvent,
  processTranscriptBlock,
} from "@/lib/intent-bridge";
import { meetingExists } from "@/lib/api/store";
import {
  validSignature,
  webhookRoute,
  webhookSecret,
  type WebhookProvider,
} from "@/lib/api/webhooks";

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

  const receiptId = `evt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;

  if (provider === "transcript") {
    const { transcript, meetingId } = extractTranscriptEvent(event);

    if (!transcript?.trim()) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Transcript webhook events must include a transcript or text field.",
        { transcript: "Provide a non-empty transcript string." },
      );
    }

    if (meetingId && !(await meetingExists(meetingId))) {
      return fail(422, "VALIDATION_ERROR", "The meeting does not exist.", {
        meetingId: "Unknown meeting.",
      });
    }

    try {
      const result = await processTranscriptBlock(transcript.trim(), meetingId);

      return ok(
        {
          accepted: true,
          receiptId,
          provider,
          destination,
          verification: secret ? "verified" : "mock",
          intent: result.intent,
          action: result.action,
        },
        { status: 202 },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Intent parsing failed";

      return fail(502, "INTENT_PARSE_FAILED", message);
    }
  }

  return ok(
    {
      accepted: true,
      receiptId,
      provider,
      destination,
      verification: secret ? "verified" : "mock",
      event,
    },
    { status: 202 },
  );
}
