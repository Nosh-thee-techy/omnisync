"use client";

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import type { CaptureMode, CaptureState, Segment } from "@/lib/types";

interface Props {
  segments: Segment[];
  captureState: CaptureState;
  captureMode: CaptureMode;
  tabStream: MediaStream | null;
  targetLanguage: string;
  onTargetLanguage: (lang: string) => void;
  onStart: (mode: CaptureMode) => void;
  onStop: () => void;
  error: string | null;
}

const LANGUAGES = [
  ["en", "English"], ["es", "Español"], ["ja", "日本語"], ["fr", "Français"],
  ["de", "Deutsch"], ["pt", "Português"], ["sw", "Kiswahili"],
] as const;

function TabThumbnail({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  // muted is load-bearing: an unmuted element replays the call into the room.
  return <video ref={ref} autoPlay muted playsInline className="h-16 w-28 rounded-lg border border-slate-200 bg-slate-900 object-cover" />;
}

export function TranscriptPanel(p: Props) {
  const live = p.captureState === "live";
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [p.segments.length]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`relative flex size-8 items-center justify-center rounded-full ${live ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500"}`}>
            {live && <span className="absolute size-4 animate-ping rounded-full bg-rose-200" />}
            <Mic className="relative size-4" />
          </span>
          <div>
            <p className="text-sm font-bold">{live ? "Listening" : p.captureState === "requesting" ? "Connecting…" : "Not connected"}</p>
            <p className="text-xs text-slate-400">
              {live ? (p.captureMode === "sample" ? "Replaying sample meeting" : "Tab audio + microphone · two Realtime sessions") : "Share the meeting tab to begin"}
            </p>
          </div>
          {p.tabStream && <TabThumbnail stream={p.tabStream} />}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={p.targetLanguage}
            onChange={(e) => p.onTargetLanguage(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
            aria-label="Translate to"
          >
            {LANGUAGES.map(([code, name]) => <option key={code} value={code}>→ {name}</option>)}
          </select>
          {live ? (
            <button onClick={p.onStop} className="flex h-9 items-center gap-2 rounded-lg bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100">
              <Square className="size-3 fill-current" />Stop &amp; purge
            </button>
          ) : (
            <>
              <button onClick={() => p.onStart("live")} className="flex h-9 items-center gap-2 rounded-lg bg-[#6658e9] px-3 text-xs font-bold text-white hover:bg-[#5849d7]">
                Connect to meeting
              </button>
              <button onClick={() => p.onStart("sample")} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Sample
              </button>
            </>
          )}
        </div>
      </div>

      {p.error && <p className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-700">{p.error}</p>}

      <div className="max-h-[520px] min-h-[270px] overflow-y-auto px-5 py-5 sm:px-7">
        <div className="mb-6 flex items-center gap-2">
          <span className={`size-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className={`text-xs font-semibold ${live ? "text-emerald-600" : "text-slate-400"}`}>LIVE TRANSCRIPT</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        {p.segments.length === 0 && (
          <p className="text-sm text-slate-400">Nothing yet. Once connected, lines appear here within a second of being spoken.</p>
        )}
        {p.segments.map((s) => {
          const you = s.source === "you";
          const label = you ? "You" : s.speakerLabel ?? "Room";
          const showTranslation = s.translation && s.translation !== s.text;
          return (
            <div key={s.id} className="mb-5 flex gap-3">
              <span className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ${you ? "bg-[#6658e9]" : "bg-sky-500"}`}>
                {label.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold">{label}</span>
                  <span className="text-[10px] text-slate-400">{new Date(s.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {s.language && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{s.language}</span>}
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-700">{s.text}</p>
                {showTranslation && <p className="max-w-2xl text-sm leading-6 text-slate-400">{s.translation}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
    </section>
  );
}
