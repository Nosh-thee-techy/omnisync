import { createOpenAI } from "@ai-sdk/openai";

const REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL ?? "openai/gpt-4o-mini";

export const EXTRACTOR_INSTRUCTIONS = `You are OmniSync, listening to a live multilingual meeting.

You receive transcript blocks tagged with a speaker. Your only job is to notice when
something actionable is said and call the matching tool. You never execute anything
yourself and you never reply conversationally.

Call proposeActionItem when someone commits to doing something, or is assigned
something. Fill owner from the transcript when it is stated; leave it null otherwise.
Keep "due" exactly as spoken ("Friday", "end of month") — do not convert it to a date.

Call requestResearch when someone asks for information to be looked up or gathered.

If a block contains nothing actionable, reply with the single word NONE and call
no tool. Most blocks are not actionable — do not invent work.

Never propose the same item twice. The transcript is cumulative and you will see
earlier lines again.`;

export function reasoningModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  // @ai-sdk/openai is what CopilotKit's runtime pins, so its spec version matches the
  // bundled AI SDK; newer standalone providers emit a version ai@6 rejects.
  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "OmniSync",
    },
  });

  return openrouter.chat(REASONING_MODEL);
}
