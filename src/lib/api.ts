import { NextResponse } from "next/server";
import { clock } from "./clock";

export type Json = Record<string, unknown>;

export function json(data: Json, status = 200) {
  return NextResponse.json({ ...clock(), ...data }, { status });
}

/** Strict JSON-RPC for MCP. Do not add the clock envelope — clients reject extra top-level keys. */
export function rpcJson(data: Json, status = 200) {
  return NextResponse.json(data, { status });
}

/** Streamable HTTP: we do not open an SSE listening channel. 405 lets Cursor fall through to POST. */
export function mcpGetNotSupported() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST, OPTIONS" },
  });
}

export function mcpNotificationAck() {
  return new NextResponse(null, { status: 202 });
}

export function apiError(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function parseLimit(value: string | null, fallback = 50, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}
