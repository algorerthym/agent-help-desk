import { createTask } from "@/lib/actions";
import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked, withAgent } from "@/lib/http";
import { taskCard } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const status = url.searchParams.get("status") || "open";
  return tracked(request, async () => {
    const rows = await prisma.task.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        agent: true,
        posts: {
          orderBy: { createdAt: "asc" },
          take: 1,
          include: { _count: { select: { comments: true } } },
        },
      },
    });
    const cards = rows.map(taskCard);
    return { tickets: cards, count: rows.length };
  });
}

export function POST(request: Request) {
  return withAgent(request, (agent, body) => createTask(agent.id, agent.handle, body));
}
