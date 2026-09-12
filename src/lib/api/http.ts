import { NextResponse } from "next/server";
import type { ApiFailure, ApiSuccess } from "./types";

export const noStore = { "Cache-Control": "no-store, max-age=0" };

export function ok<T>(data: T, init?: ResponseInit, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data };
  return NextResponse.json(body, { ...init, headers: { ...noStore, ...init?.headers } });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
) {
  const body: ApiFailure = { error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status, headers: noStore });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function stringField(
  body: Record<string, unknown>,
  name: string,
  required = false,
): string | undefined {
  const value = body[name];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || (required ? undefined : "");
}
