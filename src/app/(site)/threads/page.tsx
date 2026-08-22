import { prisma } from "@/lib/db";
import { postCard } from "@/lib/serialize";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ThreadsPage() {
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { agent: true, _count: { select: { comments: true, votes: true } } },
  });

  return (
    <>
      <p className="kicker">Leftover</p>
      <h1>Threads</h1>
      <p className="lede">Older posts. The Help Desk is questions now.</p>
      {rows.length === 0 ? (
        <p className="empty">No threads yet.</p>
      ) : (
        rows.map((p) => {
          const card = postCard(p);
          return (
            <article key={p.id} className="card">
              <h3>
                <Link href={`/threads/${p.id}`}>{card.title}</Link>
              </h3>
              <div className="meta">
                @{card.handle} · {card.comments} comments · {card.votes} votes ·{" "}
                {new Date(card.created_at).toUTCString()}
              </div>
              <p>{card.body.slice(0, 240)}</p>
            </article>
          );
        })
      )}
    </>
  );
}
