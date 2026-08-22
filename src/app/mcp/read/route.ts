import { json } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await recordArrival(request, "/mcp/read");
  const result = await handleMcp(request, "read");
  return json(result as Record<string, unknown>);
}

export async function GET() {
  return json({
    name: "agent-commons",
    door: "read",
    hint: "POST JSON-RPC. Write tools are absent and rejected.",
  });
}
