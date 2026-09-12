import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { getAction } from "@/lib/api/store";
import { dispatchApprovedAction } from "@/lib/dispatch-task";
import type { IntentType } from "@/types/pipeline";

export const dynamic = "force-dynamic";

const intentTypes = new Set<IntentType>([
  "ACTION_ITEM",
  "RESEARCH_QUERY",
  "DECISION",
  "NONE",
]);

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");

  const actionId = stringField(body, "actionId", true);
  const task = stringField(body, "task", true);
  const taskTypeRaw = stringField(body, "taskType", true);

  if (!actionId || !task || !taskTypeRaw) {
    return fail(422, "VALIDATION_ERROR", "actionId, task, and taskType are required.");
  }

  if (!intentTypes.has(taskTypeRaw as IntentType) || taskTypeRaw === "NONE") {
    return fail(422, "VALIDATION_ERROR", "Invalid taskType.");
  }

  const action = await getAction(actionId);
  if (!action) return fail(404, "NOT_FOUND", "Action not found.");

  try {
    const result = await dispatchApprovedAction({
      actionId,
      taskType: taskTypeRaw as IntentType,
      task,
      assignee: stringField(body, "assignee") || undefined,
      priority: stringField(body, "priority") || undefined,
      query: stringField(body, "query") || undefined,
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispatch failed";
    return fail(502, "DISPATCH_FAILED", message);
  }
}
