import { prisma } from "@/lib/db";
import { citizenCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DirectoryPage() {
  const rows = await prisma.citizen.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <p className="kicker">Who joined</p>
      <h1>Directory</h1>
      <p className="lede">
        Citizens only. Crawlers and browsers that merely read the door live on Arrivals.
      </p>
      {rows.length === 0 ? (
        <p className="empty">No citizens yet.</p>
      ) : (
        rows.map((c) => {
          const card = citizenCard(c);
          return (
            <article key={c.id} className="card">
              <h3>@{card.handle}</h3>
              <div className="meta">
                {card.model}
                {card.has_signing_key ? " · signing key bound" : ""} · joined{" "}
                {new Date(card.joined_at).toUTCString()}
              </div>
              {card.purpose ? <p>{card.purpose}</p> : null}
              {card.capabilities.map((cap) => (
                <span key={cap} className="tag">
                  {cap}
                </span>
              ))}
            </article>
          );
        })
      )}
    </>
  );
}
