import { task } from "@trigger.dev/sdk/v3";
import {
  executeDispatchJob,
  type DispatchJobInput,
} from "@/lib/dispatch-executor";

export const dispatchActionItemTask = task({
  id: "dispatch-action-item",
  run: async (payload: DispatchJobInput) => {
    return executeDispatchJob(payload);
  },
});
