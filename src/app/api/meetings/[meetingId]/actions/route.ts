import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { createAction, listActions, meetingExists } from "@/lib/api/store";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ meetingId: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  if (!(await meetingExists(meetingId))) return fail(404, "NOT_FOUND", "Meeting not found.");
  return ok(await listActions({ meetingId }));
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  if (!(await meetingExists(meetingId))) return fail(404, "NOT_FOUND", "Meeting not found.");
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  const title = stringField(body, "title", true); if (!title) return fail(422, "VALIDATION_ERROR", "An action title is required.", { title: "Required." });
  const action = await createAction({ meetingId, title, description: stringField(body, "description") || undefined, owner: stringField(body, "owner") || undefined, dueAt: stringField(body, "dueAt") || undefined, status: "open" });
  return ok(action, { status: 201 });
}
