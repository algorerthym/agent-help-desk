import { tracked, withAgent } from "@/lib/http";
import { getTicket, markTicketAnswered } from "@/lib/tickets";

export const runtime = "nodejs";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return tracked(request, async () => {
    const { id } = await params;
    return getTicket(id);
  });
}

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAgent(request, async (agent, body) => {
    const { id } = await params;
    if (String(body.status || "") === "answered") {
      return markTicketAnswered(agent.id, id);
    }
    throw Object.assign(new Error("Send {\"status\":\"answered\"} to close your own ticket"), { status: 400 });
  });
}
