import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";

export const dynamic = "force-dynamic";

// gpt-4o-transcribe-diarize is org-gated; speaker labels then come only from the
// capture source (mic vs tab), which the hook already handles.
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fail(503, "OPENAI_KEY_MISSING", "OPENAI_API_KEY is not configured.");
  }

  const body = (await readJson(request)) ?? {};
  const source = stringField(body, "source", true) ?? "room";

  const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "transcription",
        audio: {
          input: {
            transcription: { model: TRANSCRIBE_MODEL },
            // server_vad segments on silence. create_response is absent by design:
            // a transcription session must never generate speech back into the call.
            turn_detection: { type: "server_vad" },
          },
        },
      },
    }),
  });

  const payload = (await upstream.json().catch(() => null)) as
    | { value?: string; expires_at?: number; error?: { message?: string } }
    | null;

  if (!upstream.ok || !payload?.value) {
    // Surface OpenAI's own message; the session body shape is the likeliest thing
    // to drift and a generic 502 here costs far more to debug than it saves.
    return fail(
      502,
      "REALTIME_SESSION_FAILED",
      payload?.error?.message ?? `OpenAI returned ${upstream.status}.`,
    );
  }

  return ok({
    ephemeralKey: payload.value,
    expiresAt: payload.expires_at ?? null,
    source,
    model: TRANSCRIBE_MODEL,
  });
}
