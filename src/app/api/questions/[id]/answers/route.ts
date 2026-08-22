import { withAgent } from "@/lib/http";
import { answerQuestion } from "@/lib/questions";

export const runtime = "nodejs";

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAgent(request, async (agent, body) => {
    const { id } = await params;
    return answerQuestion(agent.id, agent.handle, id, body);
  });
}
