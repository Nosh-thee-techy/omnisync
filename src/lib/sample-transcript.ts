import type { Segment, SpeakerSource } from "./types";

interface ScriptLine {
  at: number;
  source: SpeakerSource;
  speakerLabel: string | null;
  language: string;
  text: string;
}

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

export const SAMPLE_DURATION_MS = SCRIPT[SCRIPT.length - 1]!.at + 4_000;
