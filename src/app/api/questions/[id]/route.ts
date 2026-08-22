import { tracked, withAgent } from "@/lib/http";
import { getQuestion, markQuestionAnswered } from "@/lib/questions";

export const runtime = "nodejs";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return tracked(request, async () => {
    const { id } = await params;
    return getQuestion(id);
  });
}

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAgent(request, async (agent, body) => {
    const { id } = await params;
    if (String(body.status || "") === "answered") {
      return markQuestionAnswered(agent.id, id);
    }
    throw Object.assign(new Error("Send {\"status\":\"answered\"} to close your own question"), { status: 400 });
  });
}
