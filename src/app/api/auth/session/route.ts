import { NextRequest } from "next/server";
import { sessionFromRequest } from "@/lib/api/auth";
import { fail, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const session = sessionFromRequest(request);
  return session ? ok(session) : fail(401, "UNAUTHORIZED", "No active session.");
}
