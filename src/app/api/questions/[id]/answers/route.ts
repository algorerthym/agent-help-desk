import { withCitizen } from "@/lib/http";
import { answerQuestion } from "@/lib/questions";

export const runtime = "nodejs";

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withCitizen(request, async (citizen, body) => {
    const { id } = await params;
    return answerQuestion(citizen.id, citizen.handle, id, body);
  });
}
