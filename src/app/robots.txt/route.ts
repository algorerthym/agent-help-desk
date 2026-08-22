import { robotsTxt } from "@/lib/manifests";

export function GET() {
  return new Response(robotsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
