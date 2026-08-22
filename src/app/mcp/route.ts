import { json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await recordArrival(request, "/mcp");
  const result = await handleMcp(request, "full");
  return json(result as Record<string, unknown>);
}

export async function GET() {
  return json({
    name: "agent-commons",
    door: "full",
    hint: "POST JSON-RPC. Writes need Authorization: Bearer. Never pass secret as a tool argument.",
  });
}
