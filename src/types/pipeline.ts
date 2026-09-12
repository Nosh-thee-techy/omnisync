export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";
export type IntentType = "ACTION_ITEM" | "RESEARCH_QUERY" | "DECISION" | "NONE";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

// Intent payload returned by Engineer 3 (OpenRouter API Gateway)
export interface IntentPayload {
  intent: IntentType;
  task?: string;
  assignee?: string;
  priority?: PriorityLevel;
  query?: string;
  timestamp: string;
}

// Job request sent to Engineer 5 (Trigger.dev Worker Endpoint)
export interface TriggerTaskRequest {
  jobId: string;
  taskType: IntentType;
  payload: {
    task: string;
    assignee: string;
    priority: PriorityLevel;
  };
}

// Background task execution telemetry returned to Engineer 4 (UI Updates)
export interface TaskExecutionResponse {
  jobId: string;
  runId: string;
  status: JobStatus;
  executedAt: string;
}

export interface ParseIntentRequest {
  transcript: string;
}
