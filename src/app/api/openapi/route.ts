import { openApiDocument } from "@/lib/api/openapi";
import { noStore } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(openApiDocument, { headers: noStore });
}
