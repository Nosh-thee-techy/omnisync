import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { fail, ok, readJson, stringField } from "@/lib/api/http";
import { deleteMeeting, getMeeting, meetingStatuses, updateMeeting } from "@/lib/api/store";
import type { MeetingStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ meetingId: string }> };
const editable = ["title", "startsAt", "endsAt", "agenda", "notes"] as const;

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  const meeting = await getMeeting(meetingId);
  return meeting ? ok(meeting) : fail(404, "NOT_FOUND", "Meeting not found.");
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  const body = await readJson(request); if (!body) return fail(400, "INVALID_JSON", "Expected a JSON object.");

  const patch: Record<string, unknown> = {};
  for (const field of editable) {
    const value = stringField(body, field);
    if (value !== undefined) patch[field] = value || undefined;
  }
  if (typeof patch.startsAt === "string" && Number.isNaN(Date.parse(patch.startsAt))) {
    return fail(422, "VALIDATION_ERROR", "Invalid meeting start time.", { startsAt: "Use an ISO 8601 date-time." });
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !meetingStatuses.has(body.status as MeetingStatus)) return fail(422, "VALIDATION_ERROR", "Invalid meeting status.");
    patch.status = body.status as MeetingStatus;
  }
  if (body.attendees !== undefined) {
    if (!Array.isArray(body.attendees) || body.attendees.some((item) => typeof item !== "string")) return fail(422, "VALIDATION_ERROR", "Attendees must be an array of strings.");
    patch.attendees = body.attendees.map((item) => item.trim()).filter(Boolean);
  }

  const meeting = await updateMeeting(meetingId, patch);
  return meeting ? ok(meeting) : fail(404, "NOT_FOUND", "Meeting not found.");
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const { meetingId } = await context.params;
  // Actions outlive the meeting: the FK is ON DELETE SET NULL.
  if (!(await deleteMeeting(meetingId))) return fail(404, "NOT_FOUND", "Meeting not found.");
  return ok({ deleted: true, id: meetingId });
}
