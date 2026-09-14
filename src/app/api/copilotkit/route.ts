import {
  BuiltInAgent,
  type BuiltInAgentModel,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { EXTRACTOR_INSTRUCTIONS, reasoningModel } from "@/lib/copilot-runtime";

export const dynamic = "force-dynamic";

const runtime = new CopilotRuntime({
  agents: {
    extractor: new BuiltInAgent({
      // CopilotKit's model union still tops out at LanguageModelV3 while the
      // installed @ai-sdk providers emit V4. Same ai@6 major on both sides, so
      // this is a stale type rather than a real incompatibility.
      model: reasoningModel() as unknown as BuiltInAgentModel,
      prompt: EXTRACTOR_INSTRUCTIONS,
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
