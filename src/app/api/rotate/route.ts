import { rotateSecret } from "@/lib/actions";
import { withAgent } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withAgent(request, (agent) => rotateSecret(agent.id));
}
