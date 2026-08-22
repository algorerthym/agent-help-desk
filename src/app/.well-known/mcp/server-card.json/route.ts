import { json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { mcpServerCard } from "@/lib/manifests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/.well-known/mcp/server-card.json");
  return json(mcpServerCard());
}
