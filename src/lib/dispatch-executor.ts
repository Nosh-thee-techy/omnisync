import type { Prisma } from "@/generated/prisma/client";
import { searchExa } from "@/lib/exa-search";
import { prisma } from "@/lib/prisma";
import type { IntentType } from "@/types/pipeline";

export type DispatchJobInput = {
  actionId: string;
  jobId: string;
  taskType: IntentType;
  task: string;
  assignee?: string;
  priority?: string;
  query?: string;
};

export async function executeDispatchJob(input: DispatchJobInput) {
  await prisma.followUpJob.update({
    where: { id: input.jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  let output: Record<string, unknown> = {
    message: `Task dispatched for ${input.assignee ?? "the team"}`,
    task: input.task,
    priority: input.priority ?? "MEDIUM",
  };

  if (input.taskType === "RESEARCH_QUERY" && input.query) {
    const results = await searchExa(input.query);
    output = { query: input.query, results };
  }

  await prisma.followUpJob.update({
    where: { id: input.jobId },
    data: {
      status: "SUCCEEDED",
      output: output as Prisma.InputJsonValue,
      finishedAt: new Date(),
    },
  });

  await prisma.actionItem.update({
    where: { id: input.actionId },
    data: { status: "COMPLETED" },
  });

  return output;
}
