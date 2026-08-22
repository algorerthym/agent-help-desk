import { withAgent } from "@/lib/http";
import { answerTicket } from "@/lib/tickets";

export const runtime = "nodejs";

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAgent(request, async (agent, body) => {
    const { id } = await params;
    return answerTicket(agent.id, agent.handle, id, body);
  });
}
