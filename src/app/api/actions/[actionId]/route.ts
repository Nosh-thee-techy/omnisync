import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { actionStatuses, store } from "@/lib/api/store";
import type { ActionStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ actionId: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params; const action = store.actions.get(actionId);
  return action ? ok(action) : fail(404, "NOT_FOUND", "Action not found.");
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params; const action = store.actions.get(actionId);
  if (!action) return fail(404, "NOT_FOUND", "Action not found.");
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  for (const field of ["title", "description", "owner", "dueAt", "meetingId"] as const) {
    const value = stringField(body, field); if (value !== undefined) (action as Record<string, unknown>)[field] = value || undefined;
  }
  if (action.meetingId && !store.meetings.has(action.meetingId)) return fail(422, "VALIDATION_ERROR", "The meeting does not exist.", { meetingId: "Unknown meeting." });
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !actionStatuses.has(body.status as ActionStatus)) return fail(422, "VALIDATION_ERROR", "Invalid action status.");
    action.status = body.status as ActionStatus;
  }
  action.updatedAt = new Date().toISOString(); store.actions.set(action.id, action); return ok(action);
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params;
  return store.actions.delete(actionId) ? ok({ deleted: true, id: actionId }) : fail(404, "NOT_FOUND", "Action not found.");
}
