"use client";

import { useAudioStream } from "@/hooks/useAudioStream";
import type { IntentPayload } from "@/types/pipeline";

type AudioStreamerProps = {
  meetingId?: string;
  onIntent?: (intent: IntentPayload) => void;
  className?: string;
};

/** A drop-in live transcript pane for the meeting UI. */
export function AudioStreamer({ meetingId, onIntent, className }: AudioStreamerProps) {
  const {
    isListening,
    isPaused,
    isSupported,
    transcriptLines,
    error,
    startListening,
    stopListening,
    pauseListening,
  } = useAudioStream({ meetingId, onIntent });

  const status = isListening ? "Listening" : isPaused ? "Paused" : "Idle";

  return (
    <section className={className} aria-label="Live meeting transcript">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isListening ? "bg-red-500 animate-pulse" : isPaused ? "bg-amber-400" : "bg-zinc-400"}`} aria-hidden="true" />
          <span className="text-sm font-medium">{status}</span>
        </div>
        <div className="flex gap-2">
          {!isListening ? <button type="button" onClick={startListening} disabled={!isSupported} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">{isPaused ? "Resume" : "Start"}</button> : <button type="button" onClick={pauseListening} className="rounded-md border px-3 py-1.5 text-sm">Pause</button>}
          {(isListening || isPaused) && <button type="button" onClick={stopListening} className="rounded-md border px-3 py-1.5 text-sm">Stop</button>}
        </div>
      </div>

      {!isSupported && <p className="mt-3 text-sm text-amber-700">Speech recognition is unavailable in this browser. Use Chrome or Edge.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 min-h-32 rounded-lg border bg-white p-3 text-sm dark:bg-zinc-950" aria-live="polite">
        {transcriptLines.length === 0 ? <p className="text-zinc-500">Start recording to see the live transcript.</p> : transcriptLines.map((line) => <p key={line.id} className={line.isFinal ? "text-zinc-900 dark:text-zinc-100" : "italic text-zinc-500"}>{line.text}</p>)}
      </div>
    </section>
  );
}
