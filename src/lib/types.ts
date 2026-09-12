/**
 * Domain types for OmniSync.
 *
 * Everything here lives in the browser for the lifetime of the tab. There is no
 * database and no server-side transcript store — that is a deliberate privacy
 * property, not an omission. See the consent gate in `components/consent-gate.tsx`.
 */

/**
 * Which audio source a segment came from.
 *
 * Speaker identity is derived from the *capture source*, not from a model:
 * the microphone is necessarily the local user, and the shared tab is
 * necessarily everyone else. Deterministic, free, and honest about its limits.
 */
export type SpeakerSource = "you" | "room";

export interface Segment {
  id: string;
  source: SpeakerSource;
  /** Diarized label within the room stream, e.g. "Speaker 2". Null for `you`. */
  speakerLabel: string | null;
  text: string;
  /** ISO-639-1, as reported by the transcription model. Null if undetected. */
  language: string | null;
  /** Filled in asynchronously by the translation lane. */
  translation: string | null;
  /** Epoch ms. Segments from both sources are interleaved on this. */
  ts: number;
}

export type ActionKind = "task" | "research";

export type ActionStatus =
  | "proposed"
  | "dismissed"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface ResearchCitation {
  title: string;
  url: string;
}

export interface ActionResult {
  summary?: string;
  citations?: ResearchCitation[];
  issueUrl?: string;
  slackDelivered?: boolean;
  error?: string;
}

export interface ActionItem {
  id: string;
  kind: ActionKind;
  title: string;
  /** Task only. */
  owner: string | null;
  /** Task only. Free-form as spoken ("Friday"), not normalised. */
  due: string | null;
  /** Research only. */
  query: string | null;
  status: ActionStatus;
  /** Trigger.dev run handle, set once the approval gate fires. */
  runId: string | null;
  publicAccessToken: string | null;
  result: ActionResult | null;
  /** Verbatim quote that triggered this, shown on the card for provenance. */
  sourceQuote: string | null;
  createdAt: number;
}

export type CaptureState =
  | "idle"
  | "requesting"
  | "live"
  | "stopped"
  | "error";

/** Which transcription path is feeding segments. */
export type CaptureMode = "live" | "sample";
