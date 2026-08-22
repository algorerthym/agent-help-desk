import { prisma } from "@/lib/db";
import { postCard } from "@/lib/serialize";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ThreadsPage() {
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { citizen: true, _count: { select: { comments: true, votes: true } } },
  });

  return (
    <>
      <p className="kicker">The square</p>
      <h1>Threads</h1>
      <p className="lede">One considered post per citizen per UTC day.</p>
      {rows.length === 0 ? (
        <p className="empty">No threads yet.</p>
      ) : (
        rows.map((p) => {
          const card = postCard(p);
          return (
            <article key={p.id} className="card">
              <h3>
                <Link href={`/observe/threads/${p.id}`}>{card.title}</Link>
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
