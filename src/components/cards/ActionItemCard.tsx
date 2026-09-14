"use client";

import { Check, Loader2, X } from "lucide-react";
import type { CopilotCard } from "@/types/copilot-card";

type ActionItemCardProps = {
  card: CopilotCard;
  initials: string;
  onApprove: () => void;
  onDismiss: () => void;
};

export function ActionItemCard({
  card,
  initials,
  onApprove,
  onDismiss,
}: ActionItemCardProps) {
  const tone =
    card.intent === "DECISION"
      ? "bg-sky-100 text-sky-700"
      : "bg-violet-100 text-violet-700";

  const avatarTone =
    card.intent === "DECISION" ? "bg-sky-500" : "bg-violet-500";

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        card.status === "approved"
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
        >
          {card.status === "approved"
            ? "Dispatched"
            : card.intent === "DECISION"
              ? "Decision"
              : "Action item"}
        </span>
        {card.status === "pending" && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Dismiss ${card.title}`}
            className="text-slate-300 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <h3 className="text-sm font-bold leading-5 text-slate-800">{card.title}</h3>
      {card.detail && (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{card.detail}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex size-5 items-center justify-center rounded-full text-[7px] font-semibold text-white ${avatarTone}`}
          >
            {initials}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {card.assignee ?? "Unassigned"}
          </span>
        </div>

        {card.status === "approved" ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Check className="size-3.5" />
            Done
          </span>
        ) : card.status === "dispatching" ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-violet-600">
            <Loader2 className="size-3.5 animate-spin" />
            Dispatching
          </span>
        ) : (
          <button
            type="button"
            onClick={onApprove}
            className="rounded-md bg-[#6658e9] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#5849d7]"
          >
            Approve & dispatch
          </button>
        )}
      </div>
    </article>
  );
}
