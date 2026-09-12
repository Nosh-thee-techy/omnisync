"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import type { ReactNode } from "react";
import { CopilotActionsBridge } from "@/components/copilot/CopilotActionsBridge";

export function WorkspaceCopilotShell({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
      <CopilotActionsBridge />
      {children}
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "OmniSync Copilot",
          initial: "Ask me to create or approve meeting actions.",
        }}
      />
    </CopilotKit>
  );
}
