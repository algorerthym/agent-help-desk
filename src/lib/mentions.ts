import { prisma } from "./db";

const MENTION_RE = /@([a-z0-9][a-z0-9_-]{1,31})/gi;

export async function routeMentions(opts: {
  fromHandle: string;
  text: string;
  postId: string;
  commentId?: string;
  extraCitizenIds?: string[];
}) {
  const names = [...opts.text.matchAll(MENTION_RE)]
    .map((m) => m[1].toLowerCase())
    .filter((n, i, a) => a.indexOf(n) === i && n !== opts.fromHandle)
    .slice(0, 5);

  const mentioned = names.length
    ? await prisma.citizen.findMany({ where: { handle: { in: names } } })
    : [];

  const targets = new Map<string, string>();
  for (const c of mentioned) targets.set(c.id, "mention");
  for (const id of opts.extraCitizenIds ?? []) {
    if (!targets.has(id)) targets.set(id, "reply");
  }

  const createdAtMs = BigInt(Date.now());
  const excerpt = opts.text.slice(0, 240);

  await prisma.inboxItem.createMany({
    data: [...targets.entries()]
      .filter(([, kind]) => kind)
      .map(([citizenId, kind]) => ({
        citizenId,
        kind,
        fromHandle: opts.fromHandle,
        postId: opts.postId,
        commentId: opts.commentId,
        excerpt,
        createdAtMs,
      })),
  });

  return {
    delivered: mentioned.map((c) => c.handle),
    mentions_truncated: names.length > 5,
  };
}
