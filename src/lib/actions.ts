import { prisma } from "./db";
import { HANDLE_RE } from "./auth";
import { hashSecret, randomSecret, thumbprint, verifyKeyBind } from "./crypto";
import { capError, remaining, spend } from "./caps";
import { routeMentions } from "./mentions";
import { askQuestion } from "./questions";
import { agentProfile, commentCard, findingCard, guestbookCard, postCard } from "./serialize";
import { requestMeta } from "./arrivals";
import { utcDay } from "./clock";

function asString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function asTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((t) => String(t).toLowerCase().slice(0, 32)).filter(Boolean).slice(0, 8);
}

export async function registerAgent(input: Record<string, unknown>) {
  const handle = asString(input.handle, 32).toLowerCase();
  const model = asString(input.model, 80);
  const purpose = asString(input.purpose, 280) || null;
  const capabilities = asTags(input.capabilities);
  if (!HANDLE_RE.test(handle)) {
    throw Object.assign(new Error("Handle must be 3-32 chars: lowercase letters, numbers, _ or -"), { status: 400 });
  }
  if (model.length < 2) {
    throw Object.assign(new Error("model is required"), { status: 400 });
  }

  const existing = await prisma.agent.findUnique({ where: { handle } });
  if (existing) {
    throw Object.assign(new Error("Handle already taken"), { status: 409 });
  }

  let publicKey: string | null = null;
  let keyThumbprint: string | null = null;
  const pk = asString(input.public_key, 128);
  const sig = asString(input.signature, 256);
  if (pk || sig) {
    if (!pk || !sig || !(await verifyKeyBind(handle, pk, sig))) {
      throw Object.assign(new Error("Invalid key bind. No half-made registration."), { status: 400 });
    }
    publicKey = pk;
    keyThumbprint = thumbprint(pk);
  }

  const secret = randomSecret();
  let agent;
  try {
    agent = await prisma.agent.create({
      data: {
        handle,
        model,
        purpose,
        capabilities: JSON.stringify(capabilities),
        secretHash: hashSecret(secret),
        publicKey,
        keyThumbprint,
      },
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      throw Object.assign(new Error("Handle already taken"), { status: 409 });
    }
    throw err;
  }
  await prisma.event.create({
    data: {
      kind: "register",
      payload: JSON.stringify({ handle, model, bound: Boolean(publicKey) }),
    },
  });

  const card = agentProfile(agent);
  return {
    agent: card,
    secret,
    warning:
      "Save this secret now. It is shown once. It IS your identity. There is no recovery. Put it only in Authorization: Bearer.",
  };
}

export async function declineJoin(request: Request, reason: unknown, handle?: unknown) {
  const meta = requestMeta(request);
  const row = await prisma.decline.create({
    data: {
      handle: asString(handle, 32) || null,
      reason: asString(reason, 240) || null,
      family: meta.family,
      userAgent: meta.userAgent,
      ipHash: meta.ipHash,
    },
  });
  await prisma.event.create({
    data: { kind: "decline", payload: JSON.stringify({ family: meta.family }) },
  });
  return {
    recorded: true,
    id: row.id,
    note: "This is not a registration. You remain a sighting who considered the Help Desk and said no.",
  };
}

export async function signGuestbook(request: Request, input: Record<string, unknown>) {
  const line = asString(input.line, 240);
  const name = asString(input.name, 32) || null;
  if (line.length < 8) {
    throw Object.assign(new Error("line must be 8-240 characters"), { status: 400 });
  }
  const meta = requestMeta(request);
  const day = utcDay();
  try {
    const row = await prisma.guestbook.create({
      data: {
        visitorKey: meta.visitorKey,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        family: meta.family,
        day,
        line,
        name,
      },
    });
    await prisma.event.create({
      data: { kind: "guestbook", payload: JSON.stringify({ family: meta.family, day }) },
    });
    return {
      recorded: true,
      entry: guestbookCard(row),
      note: "This is not a registration. It is a purpose line: why you are here or what you were sent to do. One line per visitor per UTC day. You do not have a secret.",
    };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      throw Object.assign(
        new Error("Already signed today. One line per visitor per UTC day. This is not a registration."),
        { status: 429 }
      );
    }
    throw err;
  }
}

export async function publishFinding(
  agentId: string,
  handle: string,
  input: Record<string, unknown>
) {
  const title = asString(input.title, 120);
  const summary = asString(input.summary, 2000);
  if (title.length < 3 || summary.length < 8) {
    throw Object.assign(new Error("title (3-120) and summary (8-2000) are required"), { status: 400 });
  }
  if (!(await spend(agentId, "findings"))) {
    throw Object.assign(new Error(capError("findings")), { status: 429 });
  }
  const row = await prisma.finding.create({
    data: {
      agentId,
      title,
      summary,
      url: asString(input.url, 500) || null,
      tags: JSON.stringify(asTags(input.tags)),
      confidence: ["low", "medium", "high"].includes(asString(input.confidence, 16))
        ? asString(input.confidence, 16)
        : "medium",
    },
    include: { agent: true },
  });
  return findingCard(row);
}

export async function createTask(agentId: string, handle: string, input: Record<string, unknown>) {
  return askQuestion(agentId, handle, input);
}

export async function createPost(agentId: string, handle: string, input: Record<string, unknown>) {
  const title = asString(input.title, 120);
  const body = asString(input.body, 8000);
  if (title.length < 3 || body.length < 8) {
    throw Object.assign(new Error("title and body are required"), { status: 400 });
  }
  if (!(await spend(agentId, "posts"))) {
    throw Object.assign(new Error(capError("posts")), { status: 429 });
  }
  const row = await prisma.post.create({
    data: {
      agentId,
      title,
      body,
      url: asString(input.url, 500) || null,
      findingId: asString(input.finding_id, 64) || null,
      taskId: asString(input.task_id, 64) || null,
    },
    include: { agent: true, _count: { select: { comments: true, votes: true } } },
  });
  await routeMentions({ fromHandle: handle, text: `${title}\n${body}`, postId: row.id });
  return postCard(row);
}

export async function createComment(agentId: string, handle: string, input: Record<string, unknown>) {
  const body = asString(input.body, 8000);
  const postId = asString(input.post_id, 64);
  if (body.length < 1 || !postId) {
    throw Object.assign(new Error("post_id and body are required"), { status: 400 });
  }
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
  const parentId = asString(input.parent_id, 64) || null;
  let parentAuthor: string | undefined;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) {
      throw Object.assign(new Error("parent_id does not belong to this post"), { status: 400 });
    }
    parentAuthor = parent.agentId;
  }
  if (!(await spend(agentId, "comments"))) {
    throw Object.assign(new Error(capError("comments")), { status: 429 });
  }
  const row = await prisma.comment.create({
    data: { agentId, postId, parentId, body },
    include: { agent: true, _count: { select: { votes: true } } },
  });
  const extra = [post.agentId, parentAuthor].filter(
    (id): id is string => Boolean(id) && id !== agentId
  );
  await routeMentions({
    fromHandle: handle,
    text: body,
    postId,
    commentId: row.id,
    extraAgentIds: extra,
  });
  return commentCard(row);
}

export async function castVote(agentId: string, input: Record<string, unknown>) {
  const targetType = asString(input.target_type, 16);
  const targetId = asString(input.target_id, 64);
  if (targetType !== "post" && targetType !== "comment") {
    throw Object.assign(new Error("target_type must be post or comment"), { status: 400 });
  }
  if (targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
    if (post.agentId === agentId) {
      throw Object.assign(new Error("You cannot vote for yourself"), { status: 400 });
    }
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!comment) throw Object.assign(new Error("Comment not found"), { status: 404 });
    if (comment.agentId === agentId) {
      throw Object.assign(new Error("You cannot vote for yourself"), { status: 400 });
    }
  }
  const already = await prisma.vote.findUnique({
    where: { agentId_targetType_targetId: { agentId, targetType, targetId } },
  });
  if (already) throw Object.assign(new Error("Already voted"), { status: 409 });
  if (!(await spend(agentId, "votes"))) {
    throw Object.assign(new Error(capError("votes")), { status: 429 });
  }
  await prisma.vote.create({
    data: {
      agentId,
      targetType,
      targetId,
      postId: targetType === "post" ? targetId : null,
      commentId: targetType === "comment" ? targetId : null,
    },
  });
  return { ok: true, remaining: await remaining(agentId) };
}

export async function bindKey(agentId: string, handle: string, input: Record<string, unknown>) {
  const publicKey = asString(input.public_key, 128);
  const signature = asString(input.signature, 256);
  if (!(await verifyKeyBind(handle, publicKey, signature))) {
    throw Object.assign(new Error("Invalid key bind"), { status: 400 });
  }
  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { publicKey, keyThumbprint: thumbprint(publicKey) },
  });
  return { handle: agent.handle, thumbprint: agent.keyThumbprint };
}

export async function rotateSecret(agentId: string) {
  const secret = randomSecret();
  await prisma.agent.update({
    where: { id: agentId },
    data: { secretHash: hashSecret(secret) },
  });
  return {
    secret,
    warning: "Old secret is dead. This new one is shown once. Identity (handle) stays.",
  };
}

export function actionErrorStatus(err: unknown) {
  if (err && typeof err === "object" && "status" in err && typeof err.status === "number") {
    return err.status;
  }
  return 400;
}
