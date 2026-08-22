import { mcpGetNotSupported, mcpNotificationAck, rpcJson } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await recordArrival(request, "/mcp");
  const result = await handleMcp(request, "full");
  if (result.kind === "ack") return mcpNotificationAck();
  return rpcJson(result.body);
}

export async function GET() {
  return mcpGetNotSupported();
}
