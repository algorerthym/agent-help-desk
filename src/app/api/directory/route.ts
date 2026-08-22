import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked } from "@/lib/http";
import { citizenCard } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  return tracked(request, async () => {
    const rows = await prisma.citizen.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { citizens: rows.map(citizenCard), count: rows.length };
  });
}
