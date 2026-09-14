import { NextRequest } from "next/server";
import { auth, tasks } from "@trigger.dev/sdk";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import type { approveActionTask } from "@/trigger/follow-up";

export const dynamic = "force-dynamic";

// The only route that reaches Trigger.dev. Every outbound side effect passes
// through a human click before it gets here.
export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if ("response" in session) return session.response;

  if (!process.env.TRIGGER_SECRET_KEY) {
    return fail(503, "TRIGGER_KEY_MISSING", "TRIGGER_SECRET_KEY is not configured.");
  }

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");

  const kind = stringField(body, "kind", true);
  const title = stringField(body, "title", true);
  if ((kind !== "task" && kind !== "research") || !title) {
    return fail(422, "VALIDATION_ERROR", "kind (task|research) and title are required.");
  }

  const handle = await tasks.trigger<typeof approveActionTask>("approve-action", {
    kind,
    title,
    owner: stringField(body, "owner") || null,
    due: stringField(body, "due") || null,
    query: stringField(body, "query") || null,
    sourceQuote: stringField(body, "sourceQuote") || null,
  });

  const publicAccessToken = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return ok({ runId: handle.id, publicAccessToken });
}
