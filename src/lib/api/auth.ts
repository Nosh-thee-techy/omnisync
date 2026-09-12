import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./constants";
import { getSession } from "./store";

export { SESSION_COOKIE } from "./constants";

export function tokenFromRequest(request: NextRequest | Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return "cookies" in request ? request.cookies.get(SESSION_COOKIE)?.value : undefined;
}

export function sessionFromRequest(request: NextRequest | Request) {
  return getSession(tokenFromRequest(request));
}
