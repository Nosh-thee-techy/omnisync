/**
 * Scripted fallback transcript.
 *
 * This exists so the demo survives a failure in the live capture path. It is
 * replayed on a timer through *the same* `onSegment` callback the Realtime
 * sessions use, so everything downstream — translation, extraction, cards,
 * Trigger.dev — is byte-identical either way.
 *
 * Built up front, deliberately. A fallback written at the moment you need it
 * is not a fallback.
 */

import type { Segment, SpeakerSource } from "./types";

interface ScriptLine {
  /** Milliseconds after replay start. */
  at: number;
  source: SpeakerSource;
  speakerLabel: string | null;
  language: string;
  text: string;
}

/**
 * A short cross-border planning call. Deliberately contains exactly one clear
 * commitment and one clear research request, so both card types fire.
 */
const SCRIPT: ScriptLine[] = [
  {
    at: 1_000,
    source: "room",
    speakerLabel: "Speaker 1",
    language: "en",
    text: "Okay, so where are we on the Berlin distribution contract?",
  },
  {
    at: 5_000,
    source: "you",
    speakerLabel: null,
    language: "en",
    text: "Legal came back with comments yesterday. Mostly around the liability cap.",
  },
  {
    at: 10_000,
    source: "room",
    speakerLabel: "Speaker 2",
    language: "es",
    text: "Perdón, ¿eso afecta el calendario de lanzamiento que acordamos?",
  },
  {
    at: 15_500,
    source: "you",
    speakerLabel: null,
    language: "en",
    text: "It shouldn't. I'll send the revised contract to legal by Friday and copy you both.",
  },
  {
    at: 22_000,
    source: "room",
    speakerLabel: "Speaker 1",
    language: "en",
    text: "Good. One thing I don't have a feel for is the cost side.",
  },
  {
    at: 27_000,
    source: "room",
    speakerLabel: "Speaker 3",
    language: "ja",
    text: "EU域内の配送コストの最新データはありますか？",
  },
  {
    at: 33_000,
    source: "room",
    speakerLabel: "Speaker 1",
    language: "en",
    text: "Right — can someone pull together current EU cross-border shipping costs before we commit to pricing?",
  },
  {
    at: 40_000,
    source: "you",
    speakerLabel: null,
    language: "en",
    text: "Let's get that researched now so we can decide on this call.",
  },
  {
    at: 46_000,
    source: "room",
    speakerLabel: "Speaker 2",
    language: "es",
    text: "De acuerdo. Si los números funcionan, podemos cerrar el precio hoy.",
  },
];

/**
 * Replays the script, invoking `onSegment` at each line's scheduled offset.
 * Returns a stop function that cancels every pending timer.
 */
export function playSampleTranscript(
  onSegment: (segment: Segment) => void,
): () => void {
  const startedAt = Date.now();
  const timers = SCRIPT.map((line, index) =>
    setTimeout(() => {
      onSegment({
        id: `sample-${index}`,
        source: line.source,
        speakerLabel: line.speakerLabel,
        text: line.text,
        language: line.language,
        translation: null,
        ts: startedAt + line.at,
      });
    }, line.at),
  );

  return () => timers.forEach(clearTimeout);
}

/** Total runtime, so the UI can show replay progress. */
export const SAMPLE_DURATION_MS = SCRIPT[SCRIPT.length - 1]!.at + 4_000;
