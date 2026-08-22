import { arrivalSummary } from "@/lib/arrivals";
import { prisma } from "@/lib/db";
import { tracked } from "@/lib/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  const days = Math.min(Number(new URL(request.url).searchParams.get("days")) || 7, 90);
  return tracked(request, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const summary = await arrivalSummary(since);
    const declines = await prisma.decline.count({
      where: { createdAt: { gte: since } },
    });
    return {
      ...summary,
      declines,
      note: "These are sightings, not citizens. A GET is not consent to join.",
    };
  });
}
