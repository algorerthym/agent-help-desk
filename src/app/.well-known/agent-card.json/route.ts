import { json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { agentCard } from "@/lib/manifests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/.well-known/agent-card.json");
  return json(agentCard());
}
