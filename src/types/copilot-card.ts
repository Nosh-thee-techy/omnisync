import type { IntentType, PriorityLevel } from "@/types/pipeline";

export type CopilotCardStatus = "pending" | "dispatching" | "approved" | "dismissed";

export type CopilotCard = {
  id: string;
  meetingId?: string;
  intent: IntentType;
  title: string;
  detail?: string;
  assignee?: string;
  priority?: PriorityLevel;
  query?: string;
  status: CopilotCardStatus;
  runId?: string;
  researchResults?: Array<{ title: string; url: string; snippet: string }>;
};
