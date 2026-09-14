import { NextRequest } from "next/server";
import { runs } from "@trigger.dev/sdk";
import { requireSession } from "@/lib/api/guards";
import { fail, ok } from "@/lib/api/http";
import type { ActionResult, ActionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, ActionStatus> = {
  QUEUED: "queued",
  PENDING_VERSION: "queued",
  DELAYED: "queued",
  WAITING_FOR_DEPLOY: "queued",
  EXECUTING: "running",
  REATTEMPTING: "running",
  FROZEN: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CRASHED: "failed",
  CANCELED: "failed",
  SYSTEM_FAILURE: "failed",
  INTERRUPTED: "failed",
  EXPIRED: "failed",
  TIMED_OUT: "failed",
};

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if ("response" in session) return session.response;

  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) return fail(422, "VALIDATION_ERROR", "runId is required.");

  const run = await runs.retrieve(runId);
  const status = STATUS_MAP[run.status] ?? "running";
  const result: ActionResult | null =
    status === "completed"
      ? ((run.output as ActionResult | undefined) ?? null)
      : status === "failed"
        ? { error: run.error?.message ?? run.status }
        : null;

  return ok({ status, result });
}
