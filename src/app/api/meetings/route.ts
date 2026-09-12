import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { makeMeeting, meetingStatuses, store } from "@/lib/api/store";
import type { MeetingStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;
  const status = request.nextUrl.searchParams.get("status") as MeetingStatus | null;
  const meetings = [...store.meetings.values()]
    .filter((meeting) => !status || meeting.status === status)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return ok(meetings, undefined, { total: meetings.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");
  const title = stringField(body, "title", true);
  const startsAt = stringField(body, "startsAt", true);
  if (!title || !startsAt || Number.isNaN(Date.parse(startsAt))) {
    return fail(422, "VALIDATION_ERROR", "Meeting title and a valid start time are required.", { title: "Required.", startsAt: "Use an ISO 8601 date-time." });
  }
  const rawAttendees = Array.isArray(body.attendees) ? body.attendees.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : [];
  const requestedStatus = stringField(body, "status") as MeetingStatus | undefined;
  if (requestedStatus && !meetingStatuses.has(requestedStatus)) return fail(422, "VALIDATION_ERROR", "Invalid meeting status.", { status: "Use scheduled, live, completed, or cancelled." });
  const meeting = makeMeeting({ title, startsAt: new Date(startsAt).toISOString(), endsAt: stringField(body, "endsAt") || undefined, status: requestedStatus ?? "scheduled", attendees: rawAttendees, agenda: stringField(body, "agenda") || undefined, notes: stringField(body, "notes") || undefined });
  store.meetings.set(meeting.id, meeting);
  return ok(meeting, { status: 201 });
}
