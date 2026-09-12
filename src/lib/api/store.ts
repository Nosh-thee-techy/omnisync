import type {
  ActionItem as WireAction,
  ActionStatus,
  Meeting as WireMeeting,
  MeetingStatus,
  Session,
  User,
} from "./types";
import {
  ActionItemStatus,
  MeetingStatus as DbMeetingStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// The wire types in ./types are the published API contract and stay untouched.
// This module is the only place that knows how they map onto Prisma rows, so
// the two vocabularies can evolve independently.

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

const meetingStatusToDb: Record<MeetingStatus, DbMeetingStatus> = {
  scheduled: DbMeetingStatus.SCHEDULED,
  live: DbMeetingStatus.LIVE,
  completed: DbMeetingStatus.ENDED,
  cancelled: DbMeetingStatus.CANCELLED,
};

const meetingStatusToWire: Record<DbMeetingStatus, MeetingStatus> = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  ENDED: "completed",
  CANCELLED: "cancelled",
  // No wire equivalent; an ingest failure reads as cancelled to API clients.
  FAILED: "cancelled",
};

const actionStatusToDb: Record<ActionStatus, ActionItemStatus> = {
  open: ActionItemStatus.PROPOSED,
  in_progress: ActionItemStatus.APPROVED,
  done: ActionItemStatus.COMPLETED,
  dismissed: ActionItemStatus.REJECTED,
};

const actionStatusToWire: Record<ActionItemStatus, ActionStatus> = {
  PROPOSED: "open",
  APPROVED: "in_progress",
  // Handed to Trigger.dev — still in flight as far as API clients care.
  DISPATCHED: "in_progress",
  COMPLETED: "done",
  REJECTED: "dismissed",
};

export const meetingStatuses = new Set<MeetingStatus>(
  Object.keys(meetingStatusToDb) as MeetingStatus[],
);
export const actionStatuses = new Set<ActionStatus>(
  Object.keys(actionStatusToDb) as ActionStatus[],
);

// ---------------------------------------------------------------------------
// Row -> wire
// ---------------------------------------------------------------------------

type MeetingRow = {
  id: string;
  title: string;
  status: DbMeetingStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  agenda: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants?: { email: string | null; displayName: string }[];
};

type ActionRow = {
  id: string;
  meetingId: string | null;
  title: string;
  description: string | null;
  ownerName: string | null;
  dueAt: Date | null;
  status: ActionItemStatus;
  createdAt: Date;
  updatedAt: Date;
  owner?: { displayName: string } | null;
};

const meetingInclude = {
  participants: { select: { email: true, displayName: true } },
} as const;

const actionInclude = { owner: { select: { displayName: true } } } as const;

export function toWireMeeting(row: MeetingRow): WireMeeting {
  return {
    id: row.id,
    title: row.title,
    // startsAt is required on the wire; fall back to creation time for a
    // meeting that has no scheduled start yet.
    startsAt: (row.startedAt ?? row.createdAt).toISOString(),
    endsAt: row.endedAt?.toISOString(),
    status: meetingStatusToWire[row.status],
    attendees: (row.participants ?? [])
      .map((p) => p.email ?? p.displayName)
      .filter(Boolean),
    agenda: row.agenda ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toWireAction(row: ActionRow): WireAction {
  return {
    id: row.id,
    meetingId: row.meetingId ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    owner: row.owner?.displayName ?? row.ownerName ?? undefined,
    dueAt: row.dueAt?.toISOString(),
    status: actionStatusToWire[row.status],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export type MeetingInput = Omit<
  WireMeeting,
  "id" | "createdAt" | "updatedAt"
>;

/** Attendees arrive as email strings; each becomes a Participant on the call. */
function participantCreateData(attendees: string[]) {
  return attendees.map((value) => ({
    email: value.includes("@") ? value : null,
    displayName: value,
  }));
}

export async function listMeetings(status?: MeetingStatus | null) {
  const rows = await prisma.meeting.findMany({
    where: status ? { status: meetingStatusToDb[status] } : undefined,
    orderBy: [{ startedAt: "asc" }, { createdAt: "asc" }],
    include: meetingInclude,
  });

  return rows.map(toWireMeeting);
}

export async function getMeeting(id: string) {
  const row = await prisma.meeting.findUnique({
    where: { id },
    include: meetingInclude,
  });

  return row ? toWireMeeting(row) : undefined;
}

export async function meetingExists(id: string) {
  return (await prisma.meeting.count({ where: { id } })) > 0;
}

export async function createMeeting(input: MeetingInput) {
  const row = await prisma.meeting.create({
    data: {
      title: input.title,
      status: meetingStatusToDb[input.status],
      startedAt: new Date(input.startsAt),
      endedAt: input.endsAt ? new Date(input.endsAt) : null,
      agenda: input.agenda ?? null,
      notes: input.notes ?? null,
      participants: { create: participantCreateData(input.attendees) },
    },
    include: meetingInclude,
  });

  return toWireMeeting(row);
}

export async function updateMeeting(
  id: string,
  patch: Partial<MeetingInput>,
): Promise<WireMeeting | undefined> {
  if (!(await meetingExists(id))) {
    return undefined;
  }

  // Attendees are replaced wholesale, matching the contract's PATCH semantics.
  if (patch.attendees) {
    await prisma.participant.deleteMany({ where: { meetingId: id } });
  }

  const row = await prisma.meeting.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.status !== undefined
        ? { status: meetingStatusToDb[patch.status] }
        : {}),
      ...(patch.startsAt !== undefined
        ? { startedAt: new Date(patch.startsAt) }
        : {}),
      ...(patch.endsAt !== undefined
        ? { endedAt: patch.endsAt ? new Date(patch.endsAt) : null }
        : {}),
      ...(patch.agenda !== undefined ? { agenda: patch.agenda ?? null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      ...(patch.attendees
        ? { participants: { create: participantCreateData(patch.attendees) } }
        : {}),
    },
    include: meetingInclude,
  });

  return toWireMeeting(row);
}

/**
 * Deletes a meeting. ActionItem.meetingId is ON DELETE SET NULL, so actions
 * survive as standalone items rather than disappearing with the call.
 */
export async function deleteMeeting(id: string) {
  const { count } = await prisma.meeting.deleteMany({ where: { id } });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

export type ActionInput = Omit<WireAction, "id" | "createdAt" | "updatedAt">;

export async function listActions(filter: {
  status?: ActionStatus | null;
  meetingId?: string | null;
}) {
  const rows = await prisma.actionItem.findMany({
    where: {
      ...(filter.status ? { status: actionStatusToDb[filter.status] } : {}),
      ...(filter.meetingId ? { meetingId: filter.meetingId } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: actionInclude,
  });

  return rows.map(toWireAction);
}

export async function getAction(id: string) {
  const row = await prisma.actionItem.findUnique({
    where: { id },
    include: actionInclude,
  });

  return row ? toWireAction(row) : undefined;
}

export async function createAction(input: ActionInput) {
  const row = await prisma.actionItem.create({
    data: {
      meetingId: input.meetingId ?? null,
      title: input.title,
      description: input.description ?? null,
      ownerName: input.owner ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      status: actionStatusToDb[input.status],
    },
    include: actionInclude,
  });

  return toWireAction(row);
}

export async function updateAction(
  id: string,
  patch: Partial<ActionInput>,
): Promise<WireAction | undefined> {
  const existing = await prisma.actionItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return undefined;
  }

  const row = await prisma.actionItem.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description ?? null }
        : {}),
      ...(patch.owner !== undefined ? { ownerName: patch.owner ?? null } : {}),
      ...(patch.dueAt !== undefined
        ? { dueAt: patch.dueAt ? new Date(patch.dueAt) : null }
        : {}),
      ...(patch.meetingId !== undefined
        ? { meetingId: patch.meetingId ?? null }
        : {}),
      ...(patch.status !== undefined
        ? { status: actionStatusToDb[patch.status] }
        : {}),
    },
    include: actionInclude,
  });

  return toWireAction(row);
}

export async function deleteAction(id: string) {
  const { count } = await prisma.actionItem.deleteMany({ where: { id } });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Mock sessions
//
// Retained for /api/auth/login and /api/auth/logout, which only run when Auth0
// is not configured. Real sessions live in Postgres via the SDK's session
// store (see src/lib/session-store.ts).
// ---------------------------------------------------------------------------

type MockSessions = Map<string, Session>;

const globalStore = globalThis as typeof globalThis & {
  __omniSyncMockSessions?: MockSessions;
};

const sessions: MockSessions = (globalStore.__omniSyncMockSessions ??= new Map());

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function createSession(email: string, name?: string): Session {
  const user: User = {
    id: `usr_${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "demo"}`,
    email,
    name: name || email.split("@")[0] || "OmniSync user",
  };
  const session: Session = {
    token: id("mock"),
    user,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
  sessions.set(session.token, session);
  return session;
}

export function getSession(token?: string | null) {
  if (!token) return undefined;

  const session = sessions.get(token);

  if (!session || new Date(session.expiresAt) <= new Date()) {
    sessions.delete(token);
    return undefined;
  }

  return session;
}

export function deleteSession(token?: string | null) {
  if (token) sessions.delete(token);
}
