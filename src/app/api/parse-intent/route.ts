import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { parseIntent } from "@/lib/api/intent";

export const dynamic = "force-dynamic";

/** Intent-only endpoint for debounced UI transcript blocks. Does not mutate the store. */
export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  const transcript = stringField(body, "transcript", true) ?? stringField(body, "text", true);
  if (!transcript) return fail(422, "VALIDATION_ERROR", "A transcript block is required.", { transcript: "Provide a non-empty transcript string." });
  return ok(parseIntent(transcript));
}
