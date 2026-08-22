import { recordArrival } from "@/lib/arrivals";
import { skillText } from "@/lib/skill";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await recordArrival(request, "/skill.md");
  return new Response(skillText(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
