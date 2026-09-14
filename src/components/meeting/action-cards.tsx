"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ToolCallStatus,
  useAgent,
  useHumanInTheLoop,
  useRenderToolCall,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import type { Message, ToolCall, ToolMessage } from "@copilotkit/react-core/v2";
import { CheckCircle2, ExternalLink, Loader2, Search, Sparkles, X } from "lucide-react";
import { useMeeting } from "@/lib/meeting-store";
import type { ActionItem, ActionKind, ActionResult, ActionStatus } from "@/lib/types";

export const EXTRACTOR_AGENT_ID = "extractor";

const TaskArgs = z.object({
  title: z.string().describe("The commitment, as a short imperative sentence"),
  owner: z.string().nullable().describe("Who committed, if stated"),
  due: z.string().nullable().describe("Deadline exactly as spoken, e.g. 'Friday'"),
  sourceQuote: z.string().describe("The verbatim line that triggered this"),
});

const ResearchArgs = z.object({
  title: z.string().describe("What needs to be found out, as a short question"),
  query: z.string().describe("A web search query that would answer it"),
  sourceQuote: z.string().describe("The verbatim line that triggered this"),
});

type CardProps = {
  toolCallId: string;
  kind: ActionKind;
  args: Partial<z.infer<typeof TaskArgs> & z.infer<typeof ResearchArgs>>;
  status: ToolCallStatus;
  respond?: (result: unknown) => Promise<void>;
};

async function approve(item: Omit<ActionItem, "status" | "runId" | "publicAccessToken" | "result" | "createdAt">) {
  const response = await fetch("/api/actions/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  const payload = (await response.json()) as {
    data?: { runId: string; publicAccessToken: string };
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Approval failed.");
  }
  return payload.data;
}

function useRunPolling(item: ActionItem | undefined, onUpdate: (s: ActionStatus, r: ActionResult | null) => void) {
  const runId = item?.runId;
  const active = item?.status === "queued" || item?.status === "running";
  useEffect(() => {
    if (!runId || !active) return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/actions/status?runId=${encodeURIComponent(runId)}`);
      if (!response.ok) return;
      const { data } = (await response.json()) as { data?: { status: ActionStatus; result: ActionResult | null } };
      if (data) onUpdate(data.status, data.result);
    }, 3000);
    return () => clearInterval(timer);
  }, [runId, active, onUpdate]);
}

function ActionCard({ toolCallId, kind, args, status, respond }: CardProps) {
  const { actionItems, addActionItem, setActionStatus, updateActionItem } = useMeeting();
  const item = actionItems.find((a) => a.id === toolCallId);
  // Args stream in while the call is in progress, so edits are stored as
  // overrides and the streamed value is the fallback.
  const [titleEdit, setTitle] = useState<string | null>(null);
  const [ownerEdit, setOwner] = useState<string | null>(null);
  const [dueEdit, setDue] = useState<string | null>(null);
  const title = titleEdit ?? args.title ?? "";
  const owner = ownerEdit ?? args.owner ?? "";
  const due = dueEdit ?? args.due ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRunPolling(item, (s, r) => setActionStatus(toolCallId, s, r));

  const pending = status === ToolCallStatus.InProgress;
  const decided = item?.status && item.status !== "proposed";

  const onApprove = async () => {
    if (!respond) return;
    setBusy(true);
    setError(null);
    try {
      const base = {
        id: toolCallId,
        kind,
        title: title.trim() || args.title || "Untitled",
        owner: owner.trim() || null,
        due: due.trim() || null,
        query: kind === "research" ? args.query ?? title : null,
        sourceQuote: args.sourceQuote ?? null,
      };
      addActionItem({ ...base, status: "queued", runId: null, publicAccessToken: null, result: null, createdAt: Date.now() });
      const { runId, publicAccessToken } = await approve(base);
      updateActionItem(toolCallId, { runId, publicAccessToken });
      await respond(`approved: ${base.title}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approval failed.");
      setActionStatus(toolCallId, "failed");
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = async () => {
    if (!respond) return;
    addActionItem({
      id: toolCallId, kind, title: title || args.title || "", owner: null, due: null, query: null,
      status: "dismissed", runId: null, publicAccessToken: null, result: null, sourceQuote: null, createdAt: Date.now(),
    });
    await respond("dismissed");
  };

  if (item?.status === "dismissed") return null;

  const research = kind === "research";
  return (
    <article className={`rounded-xl border p-4 ${research ? "border-sky-200 bg-sky-50/40" : "border-violet-200 bg-violet-50/40"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-lg text-white ${research ? "bg-sky-500" : "bg-[#6658e9]"}`}>
          {research ? <Search className="size-3.5" /> : <Sparkles className="size-3.5" />}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{research ? "Research request" : "Action item"}</span>
        {pending && <Loader2 className="ml-auto size-3.5 animate-spin text-slate-400" />}
        <StatusPill status={item?.status} />
      </div>

      {decided ? (
        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
      ) : (
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" placeholder={pending ? "Listening…" : "Title"} />
      )}

      {!research && !decided && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" placeholder="Owner" />
          <input value={due} onChange={(e) => setDue(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" placeholder="Due" />
        </div>
      )}
      {!research && decided && (item.owner || item.due) && (
        <p className="mt-1 text-xs text-slate-500">{[item.owner, item.due && `due ${item.due}`].filter(Boolean).join(" · ")}</p>
      )}

      {args.sourceQuote && <p className="mt-2 border-l-2 border-slate-200 pl-2 text-xs italic text-slate-400">“{args.sourceQuote}”</p>}

      {item?.result?.summary && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{item.result.summary}</p>}
      {item?.result?.citations && item.result.citations.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.result.citations.map((c) => (
            <li key={c.url}><a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sky-700 hover:underline"><ExternalLink className="size-3" />{c.title}</a></li>
          ))}
        </ul>
      )}
      {item?.result?.issueUrl && (
        <a href={item.result.issueUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6658e9] hover:underline"><ExternalLink className="size-3" />Open GitHub issue</a>
      )}
      {item?.result?.slackDelivered && <p className="mt-1 text-xs text-emerald-600">Posted to Slack</p>}
      {(error || item?.result?.error) && <p className="mt-2 text-xs text-rose-600">{error ?? item?.result?.error}</p>}

      {!decided && respond && (
        <div className="mt-3 flex gap-2">
          <button onClick={onApprove} disabled={busy || pending} className="flex h-8 items-center gap-1.5 rounded-lg bg-[#6658e9] px-3 text-xs font-bold text-white hover:bg-[#5849d7] disabled:opacity-50">
            <CheckCircle2 className="size-3.5" />{research ? "Research now" : "Approve"}
          </button>
          <button onClick={onDismiss} disabled={busy} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <X className="size-3.5" />Dismiss
          </button>
        </div>
      )}
    </article>
  );
}

function StatusPill({ status }: { status?: ActionStatus }) {
  if (!status || status === "proposed" || status === "dismissed") return null;
  const tone: Record<ActionStatus, string> = {
    proposed: "", dismissed: "",
    queued: "bg-slate-100 text-slate-600",
    running: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
  };
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tone[status]}`}>{status}</span>;
}

function useActionTools() {
  useHumanInTheLoop({
    name: "proposeActionItem",
    description: "Propose a task someone committed to. A person will approve or dismiss it.",
    parameters: TaskArgs,
    agentId: EXTRACTOR_AGENT_ID,
    render: ({ toolCallId, args, status, respond }) => (
      <ActionCard toolCallId={toolCallId} kind="task" args={args} status={status} respond={respond} />
    ),
  });

  useHumanInTheLoop({
    name: "requestResearch",
    description: "Propose a piece of web research someone asked for. A person will approve or dismiss it.",
    parameters: ResearchArgs,
    agentId: EXTRACTOR_AGENT_ID,
    render: ({ toolCallId, args, status, respond }) => (
      <ActionCard toolCallId={toolCallId} kind="research" args={args} status={status} respond={respond} />
    ),
  });
}

export function ActionStream() {
  useActionTools();
  const { agent } = useAgent({ agentId: EXTRACTOR_AGENT_ID, updates: [UseAgentUpdate.OnMessagesChanged] });
  const renderToolCall = useRenderToolCall();

  const messages = agent.messages as Message[];
  const toolResults = new Map<string, ToolMessage>();
  for (const m of messages) if (m.role === "tool") toolResults.set(m.toolCallId, m);

  const calls: ToolCall[] = [];
  for (const m of messages) if (m.role === "assistant" && m.toolCalls) calls.push(...m.toolCalls);

  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,.025)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold">Action stream</h2>
        <span className="text-xs text-slate-400">{calls.length} proposed</span>
      </div>
      {calls.length === 0 && (
        <p className="text-sm leading-6 text-slate-400">When someone commits to something or asks for research, a card appears here for you to approve.</p>
      )}
      <div className="space-y-3">
        {[...calls].reverse().map((toolCall) => (
          <div key={toolCall.id}>{renderToolCall({ toolCall, toolMessage: toolResults.get(toolCall.id) })}</div>
        ))}
      </div>
    </aside>
  );
}
