import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { actionStatuses, makeAction, store } from "@/lib/api/store";
import type { ActionStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const auth = requireSession(request); if ("response" in auth) return auth.response;
  const status = request.nextUrl.searchParams.get("status") as ActionStatus | null;
  const meetingId = request.nextUrl.searchParams.get("meetingId");
  const actions = [...store.actions.values()].filter((action) => (!status || action.status === status) && (!meetingId || action.meetingId === meetingId));
  return ok(actions, undefined, { total: actions.length });
}

export async function POST(request: NextRequest) {
  const auth = requireSession(request); if ("response" in auth) return auth.response;
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  const title = stringField(body, "title", true); if (!title) return fail(422, "VALIDATION_ERROR", "An action title is required.", { title: "Required." });
  const meetingId = stringField(body, "meetingId") || undefined;
  if (meetingId && !store.meetings.has(meetingId)) return fail(422, "VALIDATION_ERROR", "The meeting does not exist.", { meetingId: "Unknown meeting." });
  const status = (stringField(body, "status") as ActionStatus | undefined) ?? "open";
  if (!actionStatuses.has(status)) return fail(422, "VALIDATION_ERROR", "Invalid action status.");
  const action = makeAction({ meetingId, title, description: stringField(body, "description") || undefined, owner: stringField(body, "owner") || undefined, dueAt: stringField(body, "dueAt") || undefined, status });
  store.actions.set(action.id, action); return ok(action, { status: 201 });
}
