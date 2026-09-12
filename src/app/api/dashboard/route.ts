import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/guards";
import { ok } from "@/lib/api/http";
import { listActions, listMeetings } from "@/lib/api/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request); if ("response" in auth) return auth.response;

  const [scheduled, live, open, inProgress, done, allMeetings] = await Promise.all([
    listMeetings("scheduled"),
    listMeetings("live"),
    listActions({ status: "open" }),
    listActions({ status: "in_progress" }),
    listActions({ status: "done" }),
    listMeetings(),
  ]);

  const openActions = [...open, ...inProgress];

  return ok({
    upcomingMeetings: [...scheduled, ...live].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5),
    openActions: openActions.sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")).slice(0, 10),
    counts: { meetings: allMeetings.length, openActions: openActions.length, completedActions: done.length },
  });
}
