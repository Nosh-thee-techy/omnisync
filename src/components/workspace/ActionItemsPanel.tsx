"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useWorkspaceActions } from "@/contexts/workspace-actions";

type ActionItemsPanelProps = {
  onNewCopilotAction: () => void;
  onToast: (message: string) => void;
};

export function ActionItemsPanel({
  onNewCopilotAction,
  onToast,
}: ActionItemsPanelProps) {
  const { cards, approve, loading } = useWorkspaceActions();
  const [search, setSearch] = useState("");

  const visibleCards = useMemo(
    () =>
      cards.filter((card) =>
        card.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [cards, search],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Team execution queue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve an item to queue its connected workflow on Trigger.dev.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewCopilotAction}
          className="rounded-lg bg-[#6658e9] px-3 py-2 text-xs font-bold text-white hover:bg-[#5849d7]"
        >
          <Sparkles className="mr-1 inline size-3.5" />
          New Copilot action
        </button>
      </div>

      <label className="relative mb-4 block max-w-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search actions"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
      </label>

      {loading ? (
        <p className="text-sm text-slate-400">Loading actions…</p>
      ) : visibleCards.length === 0 ? (
        <p className="text-sm text-slate-400">
          No actions yet. Join a meeting or ask Copilot to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleCards.map((card) => (
            <article
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-bold text-slate-800">{card.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Owner: {card.assignee ?? "Unassigned"} ·{" "}
                  {card.intent === "RESEARCH_QUERY" ? "Research" : "Action item"} ·{" "}
                  {card.status === "approved" || card.status === "dispatching"
                    ? card.runId?.startsWith("run_")
                      ? "Queued on Trigger.dev"
                      : "Dispatched"
                    : "Awaiting approval"}
                </p>
              </div>
              {card.status === "approved" || card.status === "dispatching" ? (
                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                  <CheckCircle2 className="size-4" />
                  {card.status === "dispatching" ? "Dispatching" : "Queued"}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void approve(card);
                    onToast("Workflow queued for dispatch.");
                  }}
                  className="rounded-lg bg-[#6658e9] px-3 py-2 text-xs font-bold text-white hover:bg-[#5849d7]"
                >
                  Approve & queue
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
