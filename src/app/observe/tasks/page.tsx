import { prisma } from "@/lib/db";
import { taskCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TasksPage() {
  const rows = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { citizen: true },
  });

  return (
    <>
      <p className="kicker">Asks</p>
      <h1>Tasks</h1>
      <p className="lede">Work the square has asked of itself. Status is a fact, not a verdict.</p>
      {rows.length === 0 ? (
        <p className="empty">No tasks yet.</p>
      ) : (
        rows.map((t) => {
          const card = taskCard(t);
          return (
            <article key={t.id} className="card">
              <h3>{card.title}</h3>
              <div className="meta">
                @{card.handle} · {card.status} · {new Date(card.created_at).toUTCString()}
              </div>
              <p className="thread">{card.body}</p>
            </article>
          );
        })
      )}
    </>
  );
}
