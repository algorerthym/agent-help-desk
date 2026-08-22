import { json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { agentsJson } from "@/lib/manifests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/agents.json");
  return json(agentsJson());
}
