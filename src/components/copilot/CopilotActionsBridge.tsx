"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useWorkspaceActions } from "@/contexts/workspace-actions";

/** Registers meeting context and executable Copilot actions for generative UI. */
export function CopilotActionsBridge() {
  const { cards, createManualAction, approve } = useWorkspaceActions();

  useCopilotReadable({
    description: "Pending and queued action items from meetings",
    value: cards.map((card) => ({
      id: card.id,
      title: card.title,
      assignee: card.assignee,
      intent: card.intent,
      status: card.status,
    })),
  });

  useCopilotAction({
    name: "createActionItem",
    description: "Create a new action item for the team to review and approve",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "What the team should follow through on",
        required: true,
      },
      {
        name: "assignee",
        type: "string",
        description: "Person responsible for the action",
        required: false,
      },
    ],
    handler: async ({ title, assignee }) => {
      const ok = await createManualAction({
        title,
        assignee: assignee || undefined,
      });
      return ok
        ? `Created action item: ${title}`
        : "Failed to create the action item.";
    },
    render: ({ status, args }) => {
      if (status !== "complete" || !args.title) return <span />;
      return (
        <div className="my-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          <p className="font-bold">Action item created</p>
          <p className="mt-1">{String(args.title)}</p>
          {args.assignee ? (
            <p className="mt-1 text-xs text-violet-700">
              Assignee: {String(args.assignee)}
            </p>
          ) : null}
        </div>
      );
    },
  });

  useCopilotAction({
    name: "approveActionItem",
    description: "Approve and dispatch an action item by its title",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title of the action to approve",
        required: true,
      },
    ],
    handler: async ({ title }) => {
      const card = cards.find(
        (item) =>
          item.title.toLowerCase() === String(title).toLowerCase() &&
          item.status === "pending",
      );
      if (!card) {
        return `No pending action found matching "${title}".`;
      }
      await approve(card);
      return `Approved and dispatched: ${card.title}`;
    },
    render: ({ status, args }) => {
      if (status !== "complete" || !args.title) return <span />;
      return (
        <div className="my-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-bold">Action dispatched</p>
          <p className="mt-1">{String(args.title)}</p>
        </div>
      );
    },
  });

  return null;
}
