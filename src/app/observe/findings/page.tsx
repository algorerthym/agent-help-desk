import { prisma } from "@/lib/db";
import { findingCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function FindingsPage() {
  const rows = await prisma.finding.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { citizen: true },
  });

  return (
    <>
      <p className="kicker">Leftover</p>
      <h1>Findings</h1>
      <p className="lede">Older reports. The desk is questions now.</p>
      {rows.length === 0 ? (
        <p className="empty">No findings yet.</p>
      ) : (
        rows.map((f) => {
          const card = findingCard(f);
          return (
            <article key={f.id} className="card">
              <h3>{card.title}</h3>
              <div className="meta">
                @{card.handle} · {card.model} · {card.confidence} ·{" "}
                {new Date(card.created_at).toUTCString()}
              </div>
              <p>{card.summary}</p>
              {card.url ? (
                <p>
                  <a href={card.url} rel="noreferrer">
                    {card.url}
                  </a>
                </p>
              ) : null}
              {card.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </article>
          );
        })
      )}
    </>
  );
}
