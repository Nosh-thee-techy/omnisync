"use client";

import {
  Bot,
  Check,
  ExternalLink,
  Mic,
  PanelRightOpen,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AudioStreamer } from "@/components/AudioStreamer";
import { ActionItemCard } from "@/components/cards/ActionItemCard";
import { ResearchCard } from "@/components/cards/ResearchCard";
import { useWorkspaceActions } from "@/contexts/workspace-actions";
import { submitTranscript } from "@/lib/submit-transcript";

type MeetingRoomProps = {
  meetUrl?: string;
  googleConnected?: boolean;
  showToast: (message: string) => void;
  onAskCopilot?: () => void;
};

const DEMO_TRANSCRIPT =
  "Alice will send the revised Berlin contract by Friday. Can someone research EU GDPR requirements for our launch?";

export function MeetingRoom({
  meetUrl,
  googleConnected,
  showToast,
  onAskCopilot,
}: MeetingRoomProps) {
  const [search, setSearch] = useState("");
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const { meetingId, meetingCards, handleIntent, approve, dismiss, initialsFor } =
    useWorkspaceActions();

  const filteredCards = useMemo(
    () =>
      meetingCards.filter((card) =>
        card.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [meetingCards, search],
  );

  const runDemo = async () => {
    setIsRunningDemo(true);
    try {
      const intent = await submitTranscript(DEMO_TRANSCRIPT);
      await handleIntent(intent);
    } catch {
      showToast("Demo failed — check that you are signed in.");
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
      <div className="space-y-5">
        {meetUrl && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_2px_5px_rgba(15,23,42,.025)]">
            <div>
              <p className="text-sm font-bold">Join your Google Meet</p>
              <p className="text-xs text-slate-400">
                Open the call, then start live capture below.
              </p>
            </div>
            <a
              href={meetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6658e9] px-3 py-2 text-xs font-bold text-white hover:bg-[#5849d7]"
            >
              Open Meet
              <ExternalLink className="size-3.5" />
            </a>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Mic className="relative size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Live meeting capture</p>
                <p className="text-xs text-slate-400">
                  Speech → intent parsing → copilot cards
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void runDemo()}
              disabled={isRunningDemo}
              className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-[#6658e9] hover:bg-violet-50 disabled:opacity-60"
            >
              {isRunningDemo ? "Running demo…" : "Run demo transcript"}
            </button>
          </div>

          <div className="px-5 py-5 sm:px-7">
            <div className="mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">
                LIVE TRANSCRIPT
              </span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <AudioStreamer meetingId={meetingId} onIntent={handleIntent} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,.025)] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-violet-100 text-[#6658e9]">
              <WandSparkles className="size-3.5" />
            </span>
            <h2 className="text-base font-bold">Meeting summary</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {meetingCards.length === 0
              ? "Start capture or run the demo to detect action items and research queries from the conversation."
              : `Copilot detected ${meetingCards.length} item${meetingCards.length === 1 ? "" : "s"} from this session. Approve any card to dispatch follow-up work.`}
          </p>
        </section>
      </div>

      <aside className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025)]">
        <div className="border-b border-slate-100 px-5 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-violet-100 text-[#6658e9]">
                <Bot className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Copilot actions</h2>
                <p className="text-[11px] text-slate-400">
                  Detected from this meeting
                </p>
              </div>
            </div>
            <PanelRightOpen className="size-4 text-slate-400" />
          </div>

          {googleConnected && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              <Check className="size-3.5" />
              Google account authorized
            </div>
          )}

          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search actions"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </label>
        </div>

        <div className="space-y-3 p-4">
          {filteredCards.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No actions yet. Speak or run the demo transcript.
            </div>
          ) : (
            filteredCards.map((card) =>
              card.intent === "RESEARCH_QUERY" ? (
                <ResearchCard
                  key={card.id}
                  card={card}
                  initials={initialsFor(card.assignee)}
                  onApprove={() => void approve(card)}
                  onDismiss={() => void dismiss(card.id)}
                />
              ) : (
                <ActionItemCard
                  key={card.id}
                  card={card}
                  initials={initialsFor(card.assignee)}
                  onApprove={() => void approve(card)}
                  onDismiss={() => void dismiss(card.id)}
                />
              ),
            )
          )}
        </div>

        <button
          type="button"
          onClick={onAskCopilot}
          className="m-4 mt-0 flex w-[calc(100%-2rem)] items-center justify-center gap-1.5 rounded-lg border border-dashed border-violet-200 py-2.5 text-xs font-bold text-[#6658e9] hover:bg-violet-50"
        >
          <Sparkles className="size-3.5" />
          Ask Copilot about this meeting
        </button>
      </aside>
    </div>
  );
}
