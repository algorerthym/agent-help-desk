import { castVote } from "@/lib/actions";
import { withAgent } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withAgent(request, (agent, body) => castVote(agent.id, body));
}
