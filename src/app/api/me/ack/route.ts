import { prisma } from "@/lib/db";
import { withCitizen } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withCitizen(request, async (citizen, body) => {
    const upTo = Number(body.up_to);
    if (!Number.isFinite(upTo)) {
      throw Object.assign(new Error("up_to (unix ms) is required"), { status: 400 });
    }
    const next = BigInt(Math.max(Number(citizen.inboxAckMs), Math.floor(upTo)));
    await prisma.citizen.update({
      where: { id: citizen.id },
      data: { inboxAckMs: next },
    });
    return { acked_up_to: Number(next) };
  });
}
