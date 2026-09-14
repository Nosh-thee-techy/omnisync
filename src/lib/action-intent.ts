import type { ActionItem } from "@/lib/api/types";
import type { IntentType } from "@/types/pipeline";
import type { CopilotCard, CopilotCardStatus } from "@/types/copilot-card";

export function initialsFor(name?: string) {
  return (name ?? "Team")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function detectIntent(action: ActionItem): IntentType {
  if (action.description?.startsWith("Research query:")) {
    return "RESEARCH_QUERY";
  }
  if (action.description === "Recorded meeting decision") {
    return "DECISION";
  }
  return "ACTION_ITEM";
}

export function wireStatusToCardStatus(status: ActionItem["status"]): CopilotCardStatus {
  if (status === "done") return "approved";
  if (status === "dismissed") return "dismissed";
  if (status === "in_progress") return "approved";
  return "pending";
}

export function cardFromAction(action: ActionItem): CopilotCard {
  const intent = detectIntent(action);
  return {
    id: action.id,
    meetingId: action.meetingId,
    intent,
    title: action.title,
    detail: action.description,
    assignee: action.owner,
    status: wireStatusToCardStatus(action.status),
    query: intent === "RESEARCH_QUERY" ? action.title : undefined,
  };
}
