import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Prisma talks to Postgres over TCP — keep this off the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const [{ now }] = await prisma.$queryRaw<[{ now: Date }]>`SELECT now()`;
    const meetings = await prisma.meeting.count();

    return NextResponse.json({
      ok: true,
      databaseTime: now,
      latencyMs: Date.now() - startedAt,
      counts: { meetings },
    });
  } catch (error) {
    console.error("[health/db]", error);

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 503 },
    );
  }
}
