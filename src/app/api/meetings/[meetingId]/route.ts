import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { meetingStatuses, store } from "@/lib/api/store";
import type { MeetingStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ meetingId: string }> };
const editable = ["title", "startsAt", "endsAt", "agenda", "notes"] as const;

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  const meeting = store.meetings.get(meetingId);
  return meeting ? ok(meeting) : fail(404, "NOT_FOUND", "Meeting not found.");
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  const meeting = store.meetings.get(meetingId);
  if (!meeting) return fail(404, "NOT_FOUND", "Meeting not found.");
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  for (const field of editable) {
    const value = stringField(body, field);
    if (value !== undefined) (meeting as Record<string, unknown>)[field] = value || undefined;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !meetingStatuses.has(body.status as MeetingStatus)) return fail(422, "VALIDATION_ERROR", "Invalid meeting status.");
    meeting.status = body.status as MeetingStatus;
  }
  if (body.attendees !== undefined) {
    if (!Array.isArray(body.attendees) || body.attendees.some((item) => typeof item !== "string")) return fail(422, "VALIDATION_ERROR", "Attendees must be an array of strings.");
    meeting.attendees = body.attendees.map((item) => item.trim()).filter(Boolean);
  }
  if (meeting.startsAt && Number.isNaN(Date.parse(meeting.startsAt))) return fail(422, "VALIDATION_ERROR", "Invalid meeting start time.", { startsAt: "Use an ISO 8601 date-time." });
  meeting.updatedAt = new Date().toISOString(); store.meetings.set(meeting.id, meeting);
  return ok(meeting);
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  if (!store.meetings.delete(meetingId)) return fail(404, "NOT_FOUND", "Meeting not found.");
  for (const action of store.actions.values()) if (action.meetingId === meetingId) { action.meetingId = undefined; action.updatedAt = new Date().toISOString(); }
  return ok({ deleted: true, id: meetingId });
}
