import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const scopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/meetings.space.readonly",
];

export function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/?google=configuration-error", request.url));
  }

  const state = randomUUID();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("omnisync-google-oauth-state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
