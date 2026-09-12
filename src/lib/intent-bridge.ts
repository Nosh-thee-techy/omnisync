import { makeAction, store } from "@/lib/api/store";
import type { ActionItem } from "@/lib/api/types";
import { parseIntentFromTranscript } from "@/lib/intent-parser";
import type { IntentPayload, PriorityLevel } from "@/types/pipeline";

function dueDateForPriority(priority?: PriorityLevel): string | undefined {
  const days =
    priority === "HIGH" ? 1 : priority === "MEDIUM" ? 7 : priority === "LOW" ? 14 : 7;

  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export function extractTranscriptEvent(event: unknown): {
  transcript?: string;
  meetingId?: string;
} {
  if (!event || typeof event !== "object") {
    return {};
  }

  const payload = event as Record<string, unknown>;
  const transcript =
    typeof payload.transcript === "string"
      ? payload.transcript
      : typeof payload.text === "string"
        ? payload.text
        : undefined;

  const meetingId =
    typeof payload.meetingId === "string" ? payload.meetingId : undefined;

  return { transcript, meetingId };
}

export function intentToAction(
  intent: IntentPayload,
  meetingId?: string,
): ActionItem | null {
  if (intent.intent === "NONE") {
    return null;
  }

  const title = intent.task ?? intent.query;
  if (!title) {
    return null;
  }

  const action = makeAction({
    meetingId,
    title,
    description:
      intent.intent === "RESEARCH_QUERY" && intent.query
        ? `Research query: ${intent.query}`
        : intent.intent === "DECISION"
          ? "Recorded meeting decision"
          : undefined,
    owner: intent.assignee,
    dueAt: dueDateForPriority(intent.priority),
    status: "open",
  });

  store.actions.set(action.id, action);
  return action;
}

export async function processTranscriptBlock(
  transcript: string,
  meetingId?: string,
): Promise<{ intent: IntentPayload; action?: ActionItem }> {
  const intent = await parseIntentFromTranscript(transcript);
  const shouldCreateAction =
    intent.intent === "ACTION_ITEM" ||
    intent.intent === "DECISION" ||
    intent.intent === "RESEARCH_QUERY";

  const action = shouldCreateAction
    ? (intentToAction(intent, meetingId) ?? undefined)
    : undefined;

  return { intent, action };
}
