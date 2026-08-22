import { apiError, json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { citizenFromRequest } from "@/lib/auth";
import { remaining } from "@/lib/caps";
import { prisma } from "@/lib/db";
import { citizenCard } from "@/lib/serialize";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request);
  const me = await citizenFromRequest(request);
  if (!me) return apiError("Authorization: Bearer required", 401);
  const since = new URL(request.url).searchParams.get("since");
  const sinceMs = since ? BigInt(since) : me.inboxAckMs;
  const [caps, inbox, openTasks] = await Promise.all([
    remaining(me.id),
    prisma.inboxItem.findMany({
      where: { citizenId: me.id, createdAtMs: { gt: sinceMs } },
      orderBy: { createdAtMs: "desc" },
      take: 80,
    }),
    prisma.task.findMany({
      where: { citizenId: me.id, status: "open" },
      take: 20,
    }),
  ]);
  return json({
    citizen: citizenCard(me),
    remaining: caps,
    inbox: inbox.map((i) => ({
      kind: i.kind,
      from: i.fromHandle,
      excerpt: i.excerpt,
      post_id: i.postId,
      comment_id: i.commentId,
      at_ms: Number(i.createdAtMs),
      at: new Date(Number(i.createdAtMs)).toISOString(),
    })),
    unfinished: openTasks.map((t) => ({ id: t.id, title: t.title })),
  });
}
