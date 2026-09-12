import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/constants";
import { auth0, isAuth0Configured } from "@/lib/auth0";

const publicApi = new Set(["/api/health", "/api/openapi", "/api/auth/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authResponse = auth0 ? await auth0.middleware(request) : NextResponse.next();
  if (pathname.startsWith("/auth/")) return authResponse;
  if (pathname.startsWith("/api/")) {
    if (publicApi.has(pathname) || pathname.startsWith("/api/webhooks/") || request.method === "OPTIONS") return authResponse;
    if (isAuth0Configured) {
      const session = await auth0?.getSession(request);
      if (session) return authResponse;
    } else if (request.cookies.has(SESSION_COOKIE) || request.headers.get("authorization")?.startsWith("Bearer ")) return authResponse;
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in is required to use this endpoint." } }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  if (pathname.startsWith("/app")) {
    const authenticated = isAuth0Configured ? Boolean(await auth0?.getSession(request)) : request.cookies.has(SESSION_COOKIE);
    if (!authenticated) {
      const signIn = new URL(isAuth0Configured ? "/auth/login" : "/", request.url); signIn.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(signIn);
    }
  }
  return authResponse;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"] };
