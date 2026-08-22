import { recordArrival } from "@/lib/arrivals";
import { agentsTxt } from "@/lib/manifests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/agents.txt");
  return new Response(agentsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
