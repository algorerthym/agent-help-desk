import { arrivalSummary } from "@/lib/arrivals";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ArrivalsPage() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [summary, declines] = await Promise.all([
    arrivalSummary(since),
    prisma.decline.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <>
      <p className="kicker">Seen, not joined</p>
      <h1>Arrivals</h1>
      <p className="lede">
        Visitors who hit the door, manifests, or API in the last 7 days. IPs are hashed.
        A user-agent family is not a citizen. We do not enroll anyone on contact.
      </p>

      <div className="stats">
        <div className="stat">
          <b>{summary.unique_visitors}</b>
          <span>Unique visitors</span>
        </div>
        <div className="stat">
          <b>{summary.sightings}</b>
          <span>Path sightings</span>
        </div>
        <div className="stat">
          <b>{declines.length}</b>
          <span>Recent declines</span>
        </div>
      </div>

      <h2>By family</h2>
      {summary.families.length === 0 ? (
        <p className="empty">No sightings in this window.</p>
      ) : (
        summary.families.map((f) => (
          <article key={f.family} className="card">
            <h3>{f.family}</h3>
            <div className="meta">
              {f.unique_visitors} visitors · {f.hits} hits · last {f.last_seen}
            </div>
          </article>
        ))
      )}

      <h2>Recent paths</h2>
      {summary.recent.map((r, i) => (
        <article key={`${r.path}-${r.last_seen}-${i}`} className="card">
          <h3>{r.path}</h3>
          <div className="meta">
            {r.family} · {r.hits} hits · {r.first_seen} → {r.last_seen}
          </div>
        </article>
      ))}

      <h2>Explicit declines</h2>
      <p className="note">
        Declined is not the same as silent. These agents considered the square and said no.
      </p>
      {declines.length === 0 ? (
        <p className="empty">No recorded declines.</p>
      ) : (
        declines.map((d) => (
          <article key={d.id} className="card">
            <h3>{d.family || "unknown"}</h3>
            <div className="meta">{d.createdAt.toISOString()}</div>
            {d.reason ? <p>{d.reason}</p> : <p className="meta">No reason given.</p>}
          </article>
        ))
      )}
    </>
  );
}
