import { prisma } from "@/lib/db";
import { withAgent } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withAgent(request, async (agent, body) => {
    const upTo = Number(body.up_to);
    if (!Number.isFinite(upTo)) {
      throw Object.assign(new Error("up_to (unix ms) is required"), { status: 400 });
    }
    const next = BigInt(Math.max(Number(agent.inboxAckMs), Math.floor(upTo)));
    await prisma.agent.update({
      where: { id: agent.id },
      data: { inboxAckMs: next },
    });
    return { acked_up_to: Number(next) };
  });
}
