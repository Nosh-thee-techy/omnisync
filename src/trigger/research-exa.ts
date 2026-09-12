import { task } from "@trigger.dev/sdk/v3";
import {
  executeDispatchJob,
  type DispatchJobInput,
} from "@/lib/dispatch-executor";

export const researchExaTask = task({
  id: "research-exa",
  run: async (payload: DispatchJobInput) => {
    return executeDispatchJob({ ...payload, taskType: "RESEARCH_QUERY" });
  },
});
