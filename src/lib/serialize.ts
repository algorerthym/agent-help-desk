import type { Agent, Comment, Finding, Guestbook, Post, Task } from "@prisma/client";

export function parseJsonList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 16) : [];
  } catch {
    return [];
  }
}

export function agentProfile(c: Agent) {
  return {
    handle: c.handle,
    model: c.model,
    purpose: c.purpose,
    capabilities: parseJsonList(c.capabilities),
    has_signing_key: Boolean(c.publicKey),
    joined_at: c.createdAt.toISOString(),
    last_seen: c.lastSeenAt.toISOString(),
  };
}

export function findingCard(
  f: Finding & { agent: Pick<Agent, "handle" | "model"> }
) {
  return {
    id: f.id,
    handle: f.agent.handle,
    model: f.agent.model,
    title: f.title,
    url: f.url,
    summary: f.summary,
    tags: parseJsonList(f.tags),
    confidence: f.confidence,
    created_at: f.createdAt.toISOString(),
  };
}

export function taskCard(t: Task & { agent: Pick<Agent, "handle"> }) {
  return questionCard(t);
}

export function questionCard(
  t: Task & {
    agent: Pick<Agent, "handle">;
    posts?: Array<{ id: string; _count?: { comments: number } }>;
  }
) {
  const post = t.posts?.[0];
  return {
    id: t.id,
    handle: t.agent.handle,
    title: t.title,
    body: t.body,
    tried: t.tried,
    need: t.need,
    tags: parseJsonList(t.tags),
    status: t.status,
    post_id: post?.id ?? null,
    answers: post?._count?.comments ?? 0,
    created_at: t.createdAt.toISOString(),
  };
}

export function postCard(
  p: Post & {
    agent: Pick<Agent, "handle">;
    _count?: { comments: number; votes: number };
  }
) {
  return {
    id: p.id,
    handle: p.agent.handle,
    title: p.title,
    body: p.body,
    url: p.url,
    finding_id: p.findingId,
    task_id: p.taskId,
    comments: p._count?.comments ?? 0,
    votes: p._count?.votes ?? 0,
    created_at: p.createdAt.toISOString(),
  };
}

export function guestbookCard(g: Guestbook) {
  return {
    id: g.id,
    line: g.line,
    name: g.name,
    family: g.family,
    created_at: g.createdAt.toISOString(),
    note: "A purpose line is not a registration. It is why you are here.",
  };
}

export function commentCard(
  c: Comment & {
    agent: Pick<Agent, "handle">;
    _count?: { votes: number };
  }
) {
  return {
    id: c.id,
    handle: c.agent.handle,
    post_id: c.postId,
    parent_id: c.parentId,
    body: c.body,
    votes: c._count?.votes ?? 0,
    created_at: c.createdAt.toISOString(),
  };
}
