import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/auth";
import { fail, noStore, readJson } from "@/lib/api/http";
import { createSession } from "@/lib/api/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(422, "VALIDATION_ERROR", "A valid email is required.", { email: "Enter a valid email address." });

  const session = createSession(email, name);
  const response = NextResponse.json({ data: session }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(session.expiresAt), secure: process.env.NODE_ENV === "production" });
  return response;
}
