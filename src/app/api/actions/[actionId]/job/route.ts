import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS = { QUEUED: "queued", RUNNING: "running", SUCCEEDED: "completed", FAILED: "failed" } as const;

export async function GET(request: NextRequest, context: RouteContext<"/api/actions/[actionId]/job">) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;

  const { actionId } = await context.params;
  const job = await prisma.followUpJob.findFirst({
    where: { actionItemId: actionId },
    orderBy: { createdAt: "desc" },
    select: { status: true, output: true, error: true, runId: true },
  });
  if (!job) return fail(404, "NOT_FOUND", "No job for this action yet.");

  return ok({ status: STATUS[job.status], result: job.output ?? (job.error ? { error: job.error } : null), runId: job.runId });
}
