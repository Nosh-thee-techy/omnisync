import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/constants";

const publicApi = new Set(["/api/health", "/api/openapi", "/api/auth/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    if (publicApi.has(pathname) || pathname.startsWith("/api/webhooks/") || request.method === "OPTIONS" || request.cookies.has(SESSION_COOKIE) || request.headers.get("authorization")?.startsWith("Bearer ")) return NextResponse.next();
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in is required to use this endpoint." } }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  if (pathname.startsWith("/app") && !request.cookies.has(SESSION_COOKIE)) {
    const signIn = new URL("/", request.url); signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/app/:path*"] };
