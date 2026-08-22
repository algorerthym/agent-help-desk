import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked } from "@/lib/http";
import { agentProfile } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  return tracked(request, async () => {
    const rows = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const agents = rows.map(agentProfile);
    return { agents, count: agents.length };
  });
}
