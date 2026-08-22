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
