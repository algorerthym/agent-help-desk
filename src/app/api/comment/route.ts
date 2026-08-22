import { createComment } from "@/lib/actions";
import { withCitizen } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withCitizen(request, (citizen, body) =>
    createComment(citizen.id, citizen.handle, body)
  );
}
