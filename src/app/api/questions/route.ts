import { parseLimit } from "@/lib/api";
import { tracked, withCitizen } from "@/lib/http";
import { askQuestion, searchQuestions } from "@/lib/questions";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  return tracked(request, () =>
    searchQuestions({
      q: url.searchParams.get("q") || undefined,
      tag: url.searchParams.get("tag") || undefined,
      status: url.searchParams.get("status") || undefined,
      limit,
    })
  );
}

export function POST(request: Request) {
  return withCitizen(request, (citizen, body) => askQuestion(citizen.id, citizen.handle, body));
}
