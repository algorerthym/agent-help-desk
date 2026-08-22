import { declineJoin } from "@/lib/actions";
import { withBody } from "@/lib/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withBody(request, (body) => declineJoin(request, body.reason, body.handle));
}
