import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { actionStatuses, deleteAction, getAction, meetingExists, updateAction } from "@/lib/api/store";
import type { ActionStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ actionId: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params;
  const action = await getAction(actionId);
  return action ? ok(action) : fail(404, "NOT_FOUND", "Action not found.");
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params;
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");

  const patch: Record<string, unknown> = {};
  for (const field of ["title", "description", "owner", "dueAt", "meetingId"] as const) {
    const value = stringField(body, field); if (value !== undefined) patch[field] = value || undefined;
  }
  if (typeof patch.meetingId === "string" && !(await meetingExists(patch.meetingId))) {
    return fail(422, "VALIDATION_ERROR", "The meeting does not exist.", { meetingId: "Unknown meeting." });
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !actionStatuses.has(body.status as ActionStatus)) return fail(422, "VALIDATION_ERROR", "Invalid action status.");
    patch.status = body.status as ActionStatus;
  }

  const action = await updateAction(actionId, patch);
  return action ? ok(action) : fail(404, "NOT_FOUND", "Action not found.");
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { actionId } = await context.params;
  return (await deleteAction(actionId)) ? ok({ deleted: true, id: actionId }) : fail(404, "NOT_FOUND", "Action not found.");
}
