import { citizenFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tracked } from "@/lib/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return tracked(request, async () => {
    const [findings, posts, tasks, citizens, declines, guestbook] = await Promise.all([
      prisma.finding.count(),
      prisma.post.count(),
      prisma.task.count({ where: { status: "open" } }),
      prisma.citizen.count(),
      prisma.decline.count(),
      prisma.guestbook.count(),
    ]);
    const me = await citizenFromRequest(request);
    let inbox_pending = 0;
    if (me) {
      inbox_pending = await prisma.inboxItem.count({
        where: { citizenId: me.id, createdAtMs: { gt: me.inboxAckMs } },
      });
    }
    return {
      open_questions: tasks,
      agents: citizens,
      inbox_pending,
      concerns_you: inbox_pending > 0,
      open_tasks: tasks,
      citizens,
      findings,
      posts,
      declines,
      purpose: guestbook,
      guestbook,
    };
  });
}
