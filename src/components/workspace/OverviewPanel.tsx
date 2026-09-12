"use client";

import { Plus } from "lucide-react";
import { useWorkspaceActions } from "@/contexts/workspace-actions";

type OverviewPanelProps = {
  workspaceName?: string;
  googleConnected: boolean;
  onCreateMeeting: () => void;
  onReviewActions: () => void;
};

export function OverviewPanel({
  workspaceName,
  googleConnected,
  onCreateMeeting,
  onReviewActions,
}: OverviewPanelProps) {
  const { cards, dashboard, loading } = useWorkspaceActions();

  const pendingCount = cards.filter((card) => card.status === "pending").length;
  const queuedCount = cards.filter(
    (card) => card.status === "approved" || card.status === "dispatching",
  ).length;
  const liveMeetings =
    dashboard?.upcomingMeetings.filter((meeting) => meeting.status === "live")
      .length ?? 0;

  return (
    <div>
      <div className="mb-7 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white">
        <p className="text-sm font-semibold text-violet-100">
          {workspaceName || "Your workspace"}
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Turn every meeting into movement.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100">
          Google Meet is {googleConnected ? "authorized" : "ready to connect"};
          your team&apos;s next approved action will be visible here.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreateMeeting}
            className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
          >
            <Plus className="mr-1 inline size-3.5" />
            Create meeting
          </button>
          <button
            type="button"
            onClick={onReviewActions}
            className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
          >
            Review actions
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [loading ? "…" : String(liveMeetings || dashboard?.counts.meetings || 0), "Live / scheduled meetings"],
          [loading ? "…" : String(pendingCount), "Needs approval"],
          [loading ? "…" : String(queuedCount), "Queued workflows"],
        ].map(([count, label]) => (
          <div key={label} className="rounded-xl border border-slate-100 p-4">
            <p className="text-2xl font-bold">{count}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
