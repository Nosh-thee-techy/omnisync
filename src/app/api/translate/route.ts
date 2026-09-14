import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";

export const dynamic = "force-dynamic";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", ja: "Japanese", fr: "French", de: "German",
  pt: "Portuguese", zh: "Chinese", ko: "Korean", it: "Italian", hi: "Hindi", sw: "Swahili",
};

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");

  const text = stringField(body, "text", true);
  const target = stringField(body, "targetLanguage", true) ?? "en";
  if (!text) return fail(422, "VALIDATION_ERROR", "text is required.");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return fail(503, "OPENROUTER_KEY_MISSING", "OPENROUTER_API_KEY is not configured.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_FAST_MODEL ?? "openai/gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Detect the language of the text and translate it to ${LANGUAGE_NAMES[target] ?? target}. Return JSON: {"language": "<ISO-639-1>", "translation": "<text>"}. If the text is already in the target language, return it unchanged.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    return fail(502, "TRANSLATE_FAILED", `OpenRouter returned ${response.status}.`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
      language?: string;
      translation?: string;
    };
    return ok({ language: parsed.language ?? null, translation: parsed.translation ?? text });
  } catch {
    return fail(502, "TRANSLATE_FAILED", "Model returned malformed JSON.");
  }
}
