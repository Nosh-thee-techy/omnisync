import type { Prisma } from "@/generated/prisma/client";
import { executeDispatchJob, type DispatchJobInput } from "@/lib/dispatch-executor";
import { prisma } from "@/lib/prisma";
import type { IntentType, TaskExecutionResponse } from "@/types/pipeline";
import type { dispatchActionItemTask } from "@/trigger/dispatch-action-item";
import type { researchExaTask } from "@/trigger/research-exa";

function canUseTriggerDev() {
  return Boolean(process.env.TRIGGER_SECRET_KEY);
}

export async function dispatchApprovedAction(input: {
  actionId: string;
  taskType: IntentType;
  task: string;
  assignee?: string;
  priority?: string;
  query?: string;
}): Promise<TaskExecutionResponse> {
  await prisma.actionItem.update({
    where: { id: input.actionId },
    data: { status: "DISPATCHED", approvedAt: new Date() },
  });

  const taskSlug =
    input.taskType === "RESEARCH_QUERY"
      ? "research-exa"
      : "dispatch-action-item";

  const job = await prisma.followUpJob.create({
    data: {
      actionItemId: input.actionId,
      taskSlug,
      status: "QUEUED",
      input: input as Prisma.InputJsonValue,
    },
  });

  const payload: DispatchJobInput = {
    actionId: input.actionId,
    jobId: job.id,
    taskType: input.taskType,
    task: input.task,
    assignee: input.assignee,
    priority: input.priority,
    query: input.query,
  };

  if (canUseTriggerDev()) {
    try {
      const { tasks } = await import("@trigger.dev/sdk/v3");
      const handle =
        input.taskType === "RESEARCH_QUERY"
          ? await tasks.trigger<typeof researchExaTask>("research-exa", payload)
          : await tasks.trigger<typeof dispatchActionItemTask>(
              "dispatch-action-item",
              payload,
            );

      await prisma.followUpJob.update({
        where: { id: job.id },
        data: { runId: handle.id, status: "RUNNING", startedAt: new Date() },
      });

      return {
        jobId: job.id,
        runId: handle.id,
        status: "processing",
        executedAt: new Date().toISOString(),
      };
    } catch {
      // Fall through to in-process execution when Trigger.dev is misconfigured.
    }
  }

  const output = await executeDispatchJob(payload);

  await prisma.followUpJob.update({
    where: { id: job.id },
    data: { runId: `local_${job.id}`, status: "SUCCEEDED" },
  });

  return {
    jobId: job.id,
    runId: `local_${job.id}`,
    status: "completed",
    executedAt: new Date().toISOString(),
    output,
  };
}
