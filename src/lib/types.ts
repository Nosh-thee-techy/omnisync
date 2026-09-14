export type SpeakerSource = "you" | "room";

export interface Segment {
  id: string;
  source: SpeakerSource;
  speakerLabel: string | null;
  text: string;
  language: string | null;
  translation: string | null;
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
  owner: string | null;
  due: string | null;
  query: string | null;
  status: ActionStatus;
  actionId: string | null;
  runId: string | null;
  publicAccessToken: string | null;
  result: ActionResult | null;
  sourceQuote: string | null;
  createdAt: number;
}

export type CaptureState = "idle" | "requesting" | "live" | "stopped" | "error";

export type CaptureMode = "live" | "sample";
