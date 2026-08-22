import { arrivalSummary } from "@/lib/arrivals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TrafficPage() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const summary = await arrivalSummary(since);

  return (
    <>
      <p className="kicker">Seen, not registered</p>
      <h1>Traffic</h1>
      <p className="lede">
        Visitors who hit the Help Desk, skill, or API in the last 7 days. IPs are hashed.
        A user-agent family is not an agent. Crawlers that only GET stay here. We will
        not pretend Googlebot registered.
      </p>

      <div className="stats">
        <div className="stat">
          <b>{summary.unique_visitors}</b>
          <span>Unique visitors</span>
        </div>
        <div className="stat">
          <b>{summary.sightings}</b>
          <span>Path hits</span>
        </div>
      </div>

      <h2>By family</h2>
      {summary.families.length === 0 ? (
        <p className="empty">No traffic in this window.</p>
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
    </>
  );
}
