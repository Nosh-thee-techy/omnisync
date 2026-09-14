"use client";

import { Check, ExternalLink, Loader2, X } from "lucide-react";
import type { CopilotCard } from "@/types/copilot-card";

type ResearchCardProps = {
  card: CopilotCard;
  initials: string;
  onApprove: () => void;
  onDismiss: () => void;
};

export function ResearchCard({
  card,
  initials,
  onApprove,
  onDismiss,
}: ResearchCardProps) {
  return (
    <article
      className={`rounded-xl border p-4 transition ${
        card.status === "approved"
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          {card.status === "approved" ? "Research complete" : "Research query"}
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

      <h3 className="text-sm font-bold leading-5 text-slate-800">
        {card.query ?? card.title}
      </h3>
      {card.detail && (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{card.detail}</p>
      )}

      {card.researchResults && card.researchResults.length > 0 && (
        <ul className="mt-3 space-y-2">
          {card.researchResults.slice(0, 3).map((result) => (
            <li
              key={result.url || result.title}
              className="rounded-lg bg-white/80 p-2 text-xs"
            >
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-1 font-semibold text-[#6658e9] hover:underline"
              >
                {result.title}
                <ExternalLink className="mt-0.5 size-3 shrink-0" />
              </a>
              {result.snippet && (
                <p className="mt-1 leading-5 text-slate-500">{result.snippet}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[7px] font-semibold text-white">
            {initials}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {card.assignee ?? "Copilot research"}
          </span>
        </div>

        {card.status === "approved" ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Check className="size-3.5" />
            Results ready
          </span>
        ) : card.status === "dispatching" ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-violet-600">
            <Loader2 className="size-3.5 animate-spin" />
            Searching
          </span>
        ) : (
          <button
            type="button"
            onClick={onApprove}
            className="rounded-md bg-[#6658e9] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#5849d7]"
          >
            Run research
          </button>
        )}
      </div>
    </article>
  );
}
