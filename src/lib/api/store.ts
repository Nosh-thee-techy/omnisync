import type { ActionItem, ActionStatus, Meeting, MeetingStatus, Session, User } from "./types";

type MockStore = {
  meetings: Map<string, Meeting>;
  actions: Map<string, ActionItem>;
  sessions: Map<string, Session>;
};

const globalStore = globalThis as typeof globalThis & { __omniPulseMockStore?: MockStore };

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function seed(): MockStore {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const meeting: Meeting = {
    id: "mtg_product_sync",
    title: "Product sync",
    startsAt: inOneHour,
    status: "scheduled",
    attendees: ["alex@omnipulse.local", "sam@omnipulse.local"],
    agenda: "Priorities, blockers, and next actions.",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const action: ActionItem = {
    id: "act_launch_brief",
    meetingId: meeting.id,
    title: "Share launch brief",
    owner: "Alex Morgan",
    dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    status: "open",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return { meetings: new Map([[meeting.id, meeting]]), actions: new Map([[action.id, action]]), sessions: new Map() };
}

export const store = (globalStore.__omniPulseMockStore ??= seed());

export function createSession(email: string, name?: string): Session {
  const user: User = { id: `usr_${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "demo"}`, email, name: name || email.split("@")[0] || "OmniPulse user" };
  const session: Session = { token: id("mock"), user, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() };
  store.sessions.set(session.token, session);
  return session;
}

export function getSession(token?: string | null) {
  if (!token) return undefined;
  const session = store.sessions.get(token);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    store.sessions.delete(token);
    return undefined;
  }
  return session;
}

export function deleteSession(token?: string | null) {
  if (token) store.sessions.delete(token);
}

export function makeMeeting(input: Omit<Meeting, "id" | "createdAt" | "updatedAt">): Meeting {
  const now = new Date().toISOString();
  return { ...input, id: id("mtg"), createdAt: now, updatedAt: now };
}

export function makeAction(input: Omit<ActionItem, "id" | "createdAt" | "updatedAt">): ActionItem {
  const now = new Date().toISOString();
  return { ...input, id: id("act"), createdAt: now, updatedAt: now };
}

export const meetingStatuses = new Set<MeetingStatus>(["scheduled", "live", "completed", "cancelled"]);
export const actionStatuses = new Set<ActionStatus>(["open", "in_progress", "done", "dismissed"]);
