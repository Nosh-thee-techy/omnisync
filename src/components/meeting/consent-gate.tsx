"use client";

import { useState } from "react";
import { Check, Copy, Headphones, ShieldCheck } from "lucide-react";

const ANNOUNCEMENT =
  "Heads up: I'm running OmniSync on this call. It transcribes and translates so we can capture action items. Nothing leaves the meeting unless someone approves it. Say the word and I'll turn it off.";

const DISCLOSURES = [
  ["What is captured", "Audio from the shared meeting tab and your microphone."],
  ["Where it goes", "Audio to OpenAI for transcription. Text to OpenRouter for translation and action-item extraction."],
  ["What is kept", "Nothing. The transcript lives in this browser tab and is gone when you close it."],
  ["What leaves the room", "Only what a person approves on a card. The model can propose; it cannot act."],
] as const;

export function ConsentGate({ onAccept }: { onAccept: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyAnnouncement = async () => {
    try {
      await navigator.clipboard.writeText(ANNOUNCEMENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_5px_rgba(15,23,42,.025)] sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-bold">Before OmniSync listens</h2>
          <p className="text-xs text-slate-500">The people on the call need to know. You are the one who tells them.</p>
        </div>
      </div>

      <dl className="mb-6 grid gap-3 sm:grid-cols-2">
        {DISCLOSURES.map(([term, detail]) => (
          <div key={term} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{term}</dt>
            <dd className="text-sm leading-6 text-slate-700">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-6 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6658e9]">Announce to the room</p>
        <p className="mb-3 text-sm leading-6 text-slate-700">“{ANNOUNCEMENT}”</p>
        <button
          type="button"
          onClick={copyAnnouncement}
          className="flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-xs font-semibold text-[#6658e9] hover:bg-violet-50"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied — paste it into the meeting chat" : "Copy for the meeting chat"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Headphones className="size-4" />
          Wear headphones, or your mic re-records everyone and every line transcribes twice.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#6658e9] px-4 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(102,88,233,.22)] hover:bg-[#5849d7]"
        >
          I’ve told the room — continue
        </button>
      </div>
    </section>
  );
}
