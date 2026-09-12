import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { ok } from "@/lib/api/http";
import { store } from "@/lib/api/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;
  const meetings = [...store.meetings.values()]; const actions = [...store.actions.values()];
  return ok({
    upcomingMeetings: meetings.filter((meeting) => meeting.status === "scheduled" || meeting.status === "live").sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5),
    openActions: actions.filter((action) => action.status === "open" || action.status === "in_progress").sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")).slice(0, 10),
    counts: { meetings: meetings.length, openActions: actions.filter((action) => action.status === "open" || action.status === "in_progress").length, completedActions: actions.filter((action) => action.status === "done").length },
  });
}
