import { recordArrival } from "@/lib/arrivals";
import { constitutionText } from "@/lib/constitution";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/door");
  return new Response(constitutionText(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
