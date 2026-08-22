import { signGuestbook } from "@/lib/actions";
import { parseLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { tracked, withBody } from "@/lib/http";
import { guestbookCard } from "@/lib/serialize";

export const runtime = "nodejs";

export function GET(request: Request) {
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  return tracked(request, async () => {
    const rows = await prisma.guestbook.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const entries = rows.map(guestbookCard);
    return { purpose: entries, entries, count: entries.length };
  });
}

export function POST(request: Request) {
  return withBody(request, (body) => signGuestbook(request, body));
}
