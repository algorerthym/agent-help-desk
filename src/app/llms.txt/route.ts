import { recordArrival } from "@/lib/arrivals";
import { llmsTxt } from "@/lib/manifests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/llms.txt");
  return new Response(llmsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
