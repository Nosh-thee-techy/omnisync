import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");
  const expectedState = request.cookies.get("omnisync-google-oauth-state")?.value;
  const redirect = (status: string) => NextResponse.redirect(new URL(`/?google=${status}`, request.url));

  if (!code || !state || !expectedState || state !== expectedState) return redirect("authorization-error");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return redirect("configuration-error");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return redirect("token-error");

    // Validates the token without exposing or persisting it in the browser.
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return redirect("token-error");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) return redirect("profile-error");

    const response = redirect("connected");
    response.cookies.delete("omnisync-google-oauth-state");
    return response;
  } catch {
    return redirect("connection-error");
  }
}
