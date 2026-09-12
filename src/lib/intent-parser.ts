import { parseIntent as parseIntentHeuristic } from "@/lib/api/intent";
import type { IntentPayload, IntentType, PriorityLevel } from "@/types/pipeline";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const TRIAGE_MODELS = [
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
] as const;

const SYSTEM_PROMPT = `You extract actionable intent from live meeting transcript blocks.

Return ONLY valid JSON with this shape:
{
  "intent": "ACTION_ITEM" | "RESEARCH_QUERY" | "DECISION" | "NONE",
  "task": string | null,
  "assignee": string | null,
  "priority": "HIGH" | "MEDIUM" | "LOW" | null,
  "query": string | null
}

Rules:
- ACTION_ITEM: someone is assigned or implied to do something (task, assignee, priority required when possible).
- RESEARCH_QUERY: someone asks to look up, research, or find information (query required).
- DECISION: a firm decision was made that should be recorded (summarize in task).
- NONE: small talk, greetings, or no actionable content.
- priority HIGH: urgent language or same-day deadlines; MEDIUM: this week; LOW: otherwise.
- Use null for fields that do not apply to the detected intent.`;

const INTENT_TYPES = new Set<IntentType>([
  "ACTION_ITEM",
  "RESEARCH_QUERY",
  "DECISION",
  "NONE",
]);

const PRIORITY_LEVELS = new Set<PriorityLevel>(["HIGH", "MEDIUM", "LOW"]);

interface RawModelIntent {
  intent?: unknown;
  task?: unknown;
  assignee?: unknown;
  priority?: unknown;
  query?: unknown;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function heuristicToPayload(transcript: string): IntentPayload {
  const parsed = parseIntentHeuristic(transcript);

  const intentMap: Record<string, IntentType> = {
    action_item: "ACTION_ITEM",
    question: "RESEARCH_QUERY",
    decision: "DECISION",
    note: "NONE",
  };

  const payload: IntentPayload = {
    intent: intentMap[parsed.intent] ?? "NONE",
    timestamp: new Date().toISOString(),
  };

  if (parsed.action?.title) payload.task = parsed.action.title;
  if (parsed.action?.owner) payload.assignee = parsed.action.owner;
  if (parsed.intent === "question") payload.query = parsed.summary;

  return payload;
}

function normalizeIntent(raw: RawModelIntent): IntentPayload {
  const intent =
    typeof raw.intent === "string" && INTENT_TYPES.has(raw.intent as IntentType)
      ? (raw.intent as IntentType)
      : "NONE";

  const payload: IntentPayload = {
    intent,
    timestamp: new Date().toISOString(),
  };

  const task = asOptionalString(raw.task);
  const assignee = asOptionalString(raw.assignee);
  const query = asOptionalString(raw.query);

  if (task) payload.task = task;
  if (assignee) payload.assignee = assignee;
  if (query) payload.query = query;

  if (
    typeof raw.priority === "string" &&
    PRIORITY_LEVELS.has(raw.priority as PriorityLevel)
  ) {
    payload.priority = raw.priority as PriorityLevel;
  }

  return payload;
}

async function callOpenRouter(
  model: string,
  transcript: string,
): Promise<RawModelIntent> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "OmniSync",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Transcript block:\n"""${transcript}"""`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return JSON.parse(content) as RawModelIntent;
}

export async function parseIntentFromTranscript(
  transcript: string,
): Promise<IntentPayload> {
  if (!process.env.OPENROUTER_API_KEY) {
    return heuristicToPayload(transcript);
  }

  let lastError: Error | undefined;

  for (const model of TRIAGE_MODELS) {
    try {
      const raw = await callOpenRouter(model, transcript);
      return normalizeIntent(raw);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) {
    return heuristicToPayload(transcript);
  }

  throw new Error("Intent parsing failed");
}
