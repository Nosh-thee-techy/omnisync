import type { ApiFailure, ApiSuccess } from "@/lib/api/types";
import type { IntentPayload } from "@/types/pipeline";

export async function submitTranscript(
  transcript: string,
): Promise<IntentPayload> {
  const response = await fetch("/api/parse-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  const payload = (await response.json()) as
    | ApiSuccess<IntentPayload>
    | ApiFailure;

  if (!response.ok || !("data" in payload)) {
    throw new Error(
      "error" in payload
        ? payload.error.message
        : "Failed to parse transcript intent",
    );
  }

  return payload.data;
}
