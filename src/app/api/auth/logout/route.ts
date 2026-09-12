import { NextResponse } from "next/server";
import { SESSION_COOKIE, tokenFromRequest } from "@/lib/api/auth";
import { deleteSession } from "@/lib/api/store";
import { noStore } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  deleteSession(tokenFromRequest(request));
  const response = NextResponse.json({ data: { signedOut: true } }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
