import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./constants";
import { getSession } from "./store";
import { auth0 } from "@/lib/auth0";

export { SESSION_COOKIE } from "./constants";

export function tokenFromRequest(request: NextRequest | Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return "cookies" in request ? request.cookies.get(SESSION_COOKIE)?.value : undefined;
}

export async function sessionFromRequest(request: NextRequest | Request) {
  if (auth0) {
    const session = await auth0.getSession(request as NextRequest);
    if (!session) return undefined;
    return {
      token: "auth0-session",
      user: {
        id: session.user.sub,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.nickname ?? session.user.email ?? "Auth0 user",
        avatarUrl: session.user.picture,
      },
      expiresAt: new Date(session.tokenSet.expiresAt * 1000).toISOString(),
    };
  }
  return getSession(tokenFromRequest(request));
}
