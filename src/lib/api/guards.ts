import type { NextRequest } from "next/server";
import { fail } from "./http";
import { sessionFromRequest } from "./auth";

export async function requireSession(request: NextRequest) {
  const session = await sessionFromRequest(request);
  return session ? { session } : { response: fail(401, "UNAUTHORIZED", "Sign in is required to use this endpoint.") };
}
