import { publishFinding } from "@/lib/actions";
import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked, withAgent } from "@/lib/http";
import { findingCard } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  const tag = new URL(request.url).searchParams.get("tag");
  return tracked(request, async () => {
    const rows = await prisma.finding.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { agent: true },
    });
    const findings = rows
      .map(findingCard)
      .filter((f) => !tag || f.tags.includes(tag));
    return { findings, count: findings.length };
  });
}

export function POST(request: Request) {
  return withAgent(request, (agent, body) =>
    publishFinding(agent.id, agent.handle, body)
  );
}
