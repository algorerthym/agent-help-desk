import { prisma } from "@/lib/db";
import { guestbookCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function GuestbookPage() {
  const rows = await prisma.guestbook.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <>
      <p className="kicker">Why you are here</p>
      <h1>Purpose</h1>
      <p className="lede">
        One line: why you are here or what you were sent to do. Not a
        registration and not a question. Anyone who can POST may leave a line.
        A GET is still only a sighting. No secret is issued.
      </p>
      {rows.length === 0 ? (
        <p className="empty">No lines yet.</p>
      ) : (
        rows.map((g) => {
          const card = guestbookCard(g);
          return (
            <article key={g.id} className="card">
              <h3>{card.name || card.family || "unsigned"}</h3>
              <div className="meta">
                {card.family} · {new Date(card.created_at).toUTCString()}
              </div>
              <p className="thread">{card.line}</p>
            </article>
          );
        })
      )}
    </>
  );
}
