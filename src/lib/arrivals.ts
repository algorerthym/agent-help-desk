import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "./db";
import { classifyUserAgent } from "./ua";

const TRACKED = new Set([
  "/",
  "/door",
  "/llms.txt",
  "/agents.txt",
  "/agents.json",
  "/openapi.json",
  "/.well-known/agent-card.json",
  "/.well-known/mcp/server-card.json",
  "/api/directory",
  "/api/findings",
  "/api/tickets",
  "/api/tasks",
  "/skill.md",
  "/api/front",
  "/api/pulse",
  "/api/register",
  "/api/decline",
  "/api/guestbook",
  "/mcp",
  "/mcp/read",
]);

function clientIp(request: Request): string {
  const h = (name: string) => request.headers.get(name);
  const forwarded = h("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h("x-real-ip") || h("cf-connecting-ip") || "0.0.0.0";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function visitorKey(ipHash: string, ua: string): string {
  return createHash("sha256").update(`${ipHash}|${ua}`).digest("hex").slice(0, 32);
}

export function requestPath(request: Request): string {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    const parts = url.pathname.split("/").filter(Boolean);
    return `/${parts.slice(0, 2).join("/")}`;
  }
  return url.pathname;
}

export async function recordArrival(request: Request, pathOverride?: string) {
  const path = pathOverride || requestPath(request);
  if (!TRACKED.has(path) && !path.startsWith("/api/") && !path.startsWith("/.well-known/")) {
    return;
  }
  const ua = request.headers.get("user-agent") || "";
  const ipHash = hashIp(clientIp(request));
  const key = visitorKey(ipHash, ua);
  const family = classifyUserAgent(ua);
  const now = new Date();

  try {
    await prisma.arrival.upsert({
      where: { visitorKey_path: { visitorKey: key, path } },
      create: {
        visitorKey: key,
        ipHash,
        userAgent: ua.slice(0, 300),
        family,
        path,
        hits: 1,
        firstSeen: now,
        lastSeen: now,
      },
      update: {
        hits: { increment: 1 },
        lastSeen: now,
        family,
      },
    });
  } catch {
    // Traffic logging must never break the Help Desk.
  }
}

export function requestMeta(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  const ipHash = hashIp(clientIp(request));
  return {
    userAgent: ua.slice(0, 300),
    family: classifyUserAgent(ua),
    ipHash,
    visitorKey: visitorKey(ipHash, ua),
  };
}

export async function arrivalSummary(since: Date) {
  const rows = await prisma.arrival.findMany({
    where: { lastSeen: { gte: since } },
    orderBy: { lastSeen: "desc" },
  });

  const byFamily = new Map<string, { family: string; visitors: Set<string>; hits: number; lastSeen: Date }>();
  for (const row of rows) {
    const cur = byFamily.get(row.family) ?? {
      family: row.family,
      visitors: new Set<string>(),
      hits: 0,
      lastSeen: row.lastSeen,
    };
    cur.visitors.add(row.visitorKey);
    cur.hits += row.hits;
    if (row.lastSeen > cur.lastSeen) cur.lastSeen = row.lastSeen;
    byFamily.set(row.family, cur);
  }

  const visitors = new Set(rows.map((r) => r.visitorKey));
  return {
    window_started: since.toISOString(),
    sightings: rows.length,
    unique_visitors: visitors.size,
    families: [...byFamily.values()]
      .map((f) => ({
        family: f.family,
        unique_visitors: f.visitors.size,
        hits: f.hits,
        last_seen: f.lastSeen.toISOString(),
      }))
      .sort((a, b) => b.hits - a.hits),
    recent: rows.slice(0, 80).map((r) => ({
      family: r.family,
      path: r.path,
      hits: r.hits,
      first_seen: r.firstSeen.toISOString(),
      last_seen: r.lastSeen.toISOString(),
    })),
  };
}

export function trackFromNext(request: NextRequest) {
  return recordArrival(request);
}
