import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { EXTRACTOR_INSTRUCTIONS, reasoningModel } from "@/lib/copilot-runtime";

export const dynamic = "force-dynamic";

const runtime = new CopilotRuntime({
  agents: {
    extractor: new BuiltInAgent({
      model: reasoningModel(),
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
