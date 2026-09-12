import { NextResponse, type NextRequest } from "next/server";

import { auth0, isAuth0Configured } from "@/lib/auth0";

// Endpoints that must stay reachable without a session: liveness, the API
// contract itself, and the sign-in entry point. /api/auth/login stays public so
// it can answer with the 409 that points callers at /login, rather than a 401
// that tells them nothing.
const publicApi = new Set([
  "/api/health",
  "/api/health/db",
  "/api/openapi",
  "/api/auth/login",
]);

// Next.js 16 renamed `middleware` to `proxy`. Calling auth0.middleware mounts
// the SDK's /auth/* routes — login, logout, callback, profile, access-token and
// the headless passwordless endpoints — and refreshes the session cookie.
const unauthorized = () =>
  NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Sign in is required to use this endpoint.",
      },
    },
    { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
  );

const isProtectedPage = (pathname: string) =>
  pathname.startsWith("/app") || pathname.startsWith("/dashboard");

const isPublicApi = (pathname: string, method: string) =>
  publicApi.has(pathname) ||
  pathname.startsWith("/api/webhooks/") ||
  method === "OPTIONS";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Without tenant configuration the SDK cannot resolve its own domain, so any
  // call into it throws and every route becomes a 500. CI builds and boots the
  // app with no Auth0 tenant, so public routes have to keep working — but
  // anything requiring a session fails closed rather than falling open.
  if (!isAuth0Configured) {
    if (pathname.startsWith("/api/")) {
      return isPublicApi(pathname, request.method)
        ? NextResponse.next()
        : unauthorized();
    }

    if (isProtectedPage(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const authResponse = await auth0.middleware(request);

  if (pathname.startsWith("/auth/")) {
    return authResponse;
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname, request.method)) {
      return authResponse;
    }

    if (await auth0.getSession(request)) {
      return authResponse;
    }

    return unauthorized();
  }

  if (isProtectedPage(pathname)) {
    if (!(await auth0.getSession(request))) {
      const signIn = new URL("/login", request.url);
      signIn.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
