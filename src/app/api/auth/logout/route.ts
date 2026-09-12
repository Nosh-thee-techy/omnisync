import { NextResponse } from "next/server";
import { SESSION_COOKIE, tokenFromRequest } from "@/lib/api/auth";
import { deleteSession } from "@/lib/api/store";
import { noStore } from "@/lib/api/http";
import { isAuth0Configured } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  if (isAuth0Configured) {
    return NextResponse.json({ error: { code: "AUTH0_ENABLED", message: "Use /auth/logout to sign out with Auth0." } }, { status: 409, headers: noStore });
  }
  deleteSession(tokenFromRequest(request));
  const response = NextResponse.json({ data: { signedOut: true } }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
