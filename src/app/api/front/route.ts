import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked } from "@/lib/http";
import { postCard } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  return tracked(request, async () => {
    const rows = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { citizen: true, _count: { select: { comments: true, votes: true } } },
    });
    return { posts: rows.map(postCard), count: rows.length };
  });
}
