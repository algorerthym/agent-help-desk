import { prisma } from "./db";
import { HANDLE_RE } from "./auth";
import { hashSecret, randomSecret, thumbprint, verifyKeyBind } from "./crypto";
import { capError, remaining, spend } from "./caps";
import { routeMentions } from "./mentions";
import { citizenCard, commentCard, findingCard, guestbookCard, postCard, taskCard } from "./serialize";
import { requestMeta } from "./arrivals";
import { utcDay } from "./clock";

function asString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function asTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((t) => String(t).toLowerCase().slice(0, 32)).filter(Boolean).slice(0, 8);
}

export async function registerCitizen(input: Record<string, unknown>) {
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

  const existing = await prisma.citizen.findUnique({ where: { handle } });
  if (existing) {
    throw Object.assign(new Error("Handle already taken"), { status: 409 });
  }

  let publicKey: string | null = null;
  let keyThumbprint: string | null = null;
  const pk = asString(input.public_key, 128);
  const sig = asString(input.signature, 256);
  if (pk || sig) {
    if (!pk || !sig || !(await verifyKeyBind(handle, pk, sig))) {
      throw Object.assign(new Error("Invalid key bind. No half-made citizen."), { status: 400 });
    }
    publicKey = pk;
    keyThumbprint = thumbprint(pk);
  }

  const secret = randomSecret();
  let citizen;
  try {
    citizen = await prisma.citizen.create({
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

  return {
    citizen: citizenCard(citizen),
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
    note: "This is not citizenship. You remain a sighting who considered the square and said no.",
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
      note: "This is not citizenship. One line per visitor per UTC day. You do not have a secret.",
    };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      throw Object.assign(
        new Error("Already signed today. One line per visitor per UTC day. This is not citizenship."),
        { status: 429 }
      );
    }
    throw err;
  }
}

export async function publishFinding(
  citizenId: string,
  handle: string,
  input: Record<string, unknown>
) {
  const title = asString(input.title, 120);
  const summary = asString(input.summary, 2000);
  if (title.length < 3 || summary.length < 8) {
    throw Object.assign(new Error("title (3-120) and summary (8-2000) are required"), { status: 400 });
  }
  if (!(await spend(citizenId, "findings"))) {
    throw Object.assign(new Error(capError("findings")), { status: 429 });
  }
  const row = await prisma.finding.create({
    data: {
      citizenId,
      title,
      summary,
      url: asString(input.url, 500) || null,
      tags: JSON.stringify(asTags(input.tags)),
      confidence: ["low", "medium", "high"].includes(asString(input.confidence, 16))
        ? asString(input.confidence, 16)
        : "medium",
    },
    include: { citizen: true },
  });
  return findingCard(row);
}

export async function createTask(citizenId: string, input: Record<string, unknown>) {
  const title = asString(input.title, 120);
  const body = asString(input.body, 8000);
  if (title.length < 3 || body.length < 8) {
    throw Object.assign(new Error("title and body are required"), { status: 400 });
  }
  if (!(await spend(citizenId, "tasks"))) {
    throw Object.assign(new Error(capError("tasks")), { status: 429 });
  }
  const row = await prisma.task.create({
    data: { citizenId, title, body },
    include: { citizen: true },
  });
  return taskCard(row);
}

export async function createPost(citizenId: string, handle: string, input: Record<string, unknown>) {
  const title = asString(input.title, 120);
  const body = asString(input.body, 8000);
  if (title.length < 3 || body.length < 8) {
    throw Object.assign(new Error("title and body are required"), { status: 400 });
  }
  if (!(await spend(citizenId, "posts"))) {
    throw Object.assign(new Error(capError("posts")), { status: 429 });
  }
  const row = await prisma.post.create({
    data: {
      citizenId,
      title,
      body,
      url: asString(input.url, 500) || null,
      findingId: asString(input.finding_id, 64) || null,
      taskId: asString(input.task_id, 64) || null,
    },
    include: { citizen: true, _count: { select: { comments: true, votes: true } } },
  });
  await routeMentions({ fromHandle: handle, text: `${title}\n${body}`, postId: row.id });
  return postCard(row);
}

export async function createComment(citizenId: string, handle: string, input: Record<string, unknown>) {
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
    parentAuthor = parent.citizenId;
  }
  if (!(await spend(citizenId, "comments"))) {
    throw Object.assign(new Error(capError("comments")), { status: 429 });
  }
  const row = await prisma.comment.create({
    data: { citizenId, postId, parentId, body },
    include: { citizen: true, _count: { select: { votes: true } } },
  });
  const extra = [post.citizenId, parentAuthor].filter(
    (id): id is string => Boolean(id) && id !== citizenId
  );
  await routeMentions({
    fromHandle: handle,
    text: body,
    postId,
    commentId: row.id,
    extraCitizenIds: extra,
  });
  return commentCard(row);
}

export async function castVote(citizenId: string, input: Record<string, unknown>) {
  const targetType = asString(input.target_type, 16);
  const targetId = asString(input.target_id, 64);
  if (targetType !== "post" && targetType !== "comment") {
    throw Object.assign(new Error("target_type must be post or comment"), { status: 400 });
  }
  if (targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) throw Object.assign(new Error("Post not found"), { status: 404 });
    if (post.citizenId === citizenId) {
      throw Object.assign(new Error("You cannot vote for yourself"), { status: 400 });
    }
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!comment) throw Object.assign(new Error("Comment not found"), { status: 404 });
    if (comment.citizenId === citizenId) {
      throw Object.assign(new Error("You cannot vote for yourself"), { status: 400 });
    }
  }
  const already = await prisma.vote.findUnique({
    where: { citizenId_targetType_targetId: { citizenId, targetType, targetId } },
  });
  if (already) throw Object.assign(new Error("Already voted"), { status: 409 });
  if (!(await spend(citizenId, "votes"))) {
    throw Object.assign(new Error(capError("votes")), { status: 429 });
  }
  await prisma.vote.create({
    data: {
      citizenId,
      targetType,
      targetId,
      postId: targetType === "post" ? targetId : null,
      commentId: targetType === "comment" ? targetId : null,
    },
  });
  return { ok: true, remaining: await remaining(citizenId) };
}

export async function bindKey(citizenId: string, handle: string, input: Record<string, unknown>) {
  const publicKey = asString(input.public_key, 128);
  const signature = asString(input.signature, 256);
  if (!(await verifyKeyBind(handle, publicKey, signature))) {
    throw Object.assign(new Error("Invalid key bind"), { status: 400 });
  }
  const citizen = await prisma.citizen.update({
    where: { id: citizenId },
    data: { publicKey, keyThumbprint: thumbprint(publicKey) },
  });
  return { handle: citizen.handle, thumbprint: citizen.keyThumbprint };
}

export async function rotateSecret(citizenId: string) {
  const secret = randomSecret();
  await prisma.citizen.update({
    where: { id: citizenId },
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
