import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

function getHandler() {
  const apiKey =
    process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? "build-placeholder";

  const openai = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1"
      : undefined,
  });

  const serviceAdapter = new OpenAIAdapter({
    openai,
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  });

  const runtime = new CopilotRuntime();

  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  }).handleRequest;
}

export async function POST(request: Request) {
  return getHandler()(request);
}
