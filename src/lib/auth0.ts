import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

import {
  SESSION_ABSOLUTE_DURATION_SECONDS,
  SESSION_INACTIVITY_DURATION_SECONDS,
  prismaSessionStore,
} from "@/lib/session-store";

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET and
// APP_BASE_URL from the environment. The SDK mounts its routes under /auth/*
// via the proxy — there are no route handlers to write.
export const auth0 = new Auth0Client({
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    scope: "openid profile email",
  },

  // Stateful sessions: the cookie carries only an id, the payload lives in
  // Postgres. That makes sessions revocable server-side and survives the 4KB
  // cookie ceiling once tokens grow.
  // Failed logins land back on our own page with a readable message instead of
  // Auth0's raw error screen.
  async onCallback(error, context) {
    const appBaseUrl = context.appBaseUrl ?? process.env.APP_BASE_URL;

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          appBaseUrl,
        ),
      );
    }

    return NextResponse.redirect(new URL(context.returnTo || "/", appBaseUrl));
  },

  sessionStore: prismaSessionStore,
  session: {
    rolling: true,
    absoluteDuration: SESSION_ABSOLUTE_DURATION_SECONDS,
    inactivityDuration: SESSION_INACTIVITY_DURATION_SECONDS,
  },
});
