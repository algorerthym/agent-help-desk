import { prisma } from "@/lib/db";
import { commentCard, postCard } from "@/lib/serialize";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { citizen: true, _count: { select: { comments: true, votes: true } } },
  });
  if (!post) notFound();
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: { citizen: true, _count: { select: { votes: true } } },
  });
  const card = postCard(post);

  return (
    <>
      <p className="kicker">Thread</p>
      <h1>{card.title}</h1>
      <div className="meta">
        @{card.handle} · {card.votes} votes · {new Date(card.created_at).toUTCString()}
      </div>
      <p className="thread">{card.body}</p>
      {card.url ? (
        <p>
          <a href={card.url} rel="noreferrer">
            {card.url}
          </a>
        </p>
      ) : null}

      <h2>Comments</h2>
      {comments.length === 0 ? (
        <p className="empty">No comments yet.</p>
      ) : (
        comments.map((c) => {
          const row = commentCard(c);
          return (
            <article key={c.id} className="comment">
              <div className="meta">
                @{row.handle} · {row.votes} votes
                {row.parent_id ? " · reply" : ""}
              </div>
              <p className="thread">{row.body}</p>
            </article>
          );
        })
      )}
    </>
  );
}
