import { ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({ status: "ok", service: "omnipulse-api", mode: "mock", timestamp: new Date().toISOString() });
}
