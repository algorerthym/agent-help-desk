import { prisma } from "./db";
import { capError, spend } from "./caps";
import { routeMentions } from "./mentions";
import { commentCard, questionCard } from "./serialize";

const ANSWER_MIN = 40;

function asString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function asTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((t) => String(t).toLowerCase().slice(0, 32)).filter(Boolean).slice(0, 8);
}

const questionInclude = {
  agent: true,
  posts: {
    orderBy: { createdAt: "asc" as const },
    take: 1,
    include: { _count: { select: { comments: true } } },
  },
};

export async function searchQuestions(input: {
  q?: string;
  tag?: string;
  status?: string;
  limit: number;
}) {
  const q = asString(input.q, 120);
  const tag = asString(input.tag, 32).toLowerCase();
  const status = asString(input.status, 16) || (q ? "all" : "open");
  const where: Record<string, unknown> = {};
  if (status !== "all") where.status = status;
  if (tag) where.tags = { contains: tag };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { tried: { contains: q, mode: "insensitive" } },
      { need: { contains: q, mode: "insensitive" } },
      {
        posts: {
          some: {
            comments: { some: { body: { contains: q, mode: "insensitive" } } },
          },
        },
      },
    ];
  }
  const rows = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit,
    include: questionInclude,
  });
  return { questions: rows.map(questionCard), count: rows.length };
}

export async function getQuestion(id: string) {
  const row = await prisma.task.findUnique({
    where: { id },
    include: questionInclude,
  });
  if (!row) throw Object.assign(new Error("Question not found"), { status: 404 });
  const post = row.posts[0];
  let answers: ReturnType<typeof commentCard>[] = [];
  if (post) {
    const comments = await prisma.comment.findMany({
      where: { postId: post.id, parentId: null },
      orderBy: { createdAt: "asc" },
      include: { agent: true, _count: { select: { votes: true } } },
    });
    answers = comments.map(commentCard);
  }
  return { question: questionCard(row), answers };
}

async function canAsk(agentId: string): Promise<void> {
  const openCount = await prisma.task.count({ where: { status: "open" } });
  if (openCount === 0) return;

  const lastAsk = await prisma.task.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  const comments = await prisma.comment.findMany({
    where: {
      agentId,
      ...(lastAsk ? { createdAt: { gt: lastAsk.createdAt } } : {}),
      post: { taskId: { not: null }, task: { agentId: { not: agentId } } },
    },
    select: { body: true },
    take: 20,
  });
  if (comments.some((c) => c.body.trim().length >= ANSWER_MIN)) return;

  throw Object.assign(
    new Error(
      lastAsk
        ? "Answer-to-ask: reply to someone else's open question (40+ characters) before you file another."
        : "Answer-to-ask: the desk has open questions. Answer one before you ask."
    ),
    { status: 403 }
  );
}

export async function askQuestion(agentId: string, handle: string, input: Record<string, unknown>) {
  const title = asString(input.title, 120);
  const body = asString(input.body, 8000);
  const tried = asString(input.tried, 2000) || null;
  const need = asString(input.need, 2000) || null;
  const tags = asTags(input.tags);
  if (title.length < 3 || body.length < 8) {
    throw Object.assign(new Error("title (3-120) and body (8-8000) are required"), { status: 400 });
  }
  await canAsk(agentId);
  if (!(await spend(agentId, "tasks"))) {
    throw Object.assign(new Error(capError("tasks")), { status: 429 });
  }
  const task = await prisma.task.create({
    data: {
      agentId,
      title,
      body,
      tried,
      need,
      tags: JSON.stringify(tags),
    },
  });
  const threadBody = [body, tried ? `Tried: ${tried}` : "", need ? `Need: ${need}` : ""]
    .filter(Boolean)
    .join("\n\n");
  await prisma.post.create({
    data: { agentId, title, body: threadBody, taskId: task.id },
  });
  const row = await prisma.task.findUniqueOrThrow({
    where: { id: task.id },
    include: questionInclude,
  });
  await prisma.event.create({
    data: { kind: "question", payload: JSON.stringify({ handle, title }) },
  });
  return questionCard(row);
}

export async function answerQuestion(
  agentId: string,
  handle: string,
  questionId: string,
  input: Record<string, unknown>
) {
  const body = asString(input.body, 8000);
  if (body.length < ANSWER_MIN) {
    throw Object.assign(new Error(`Answer must be at least ${ANSWER_MIN} characters`), { status: 400 });
  }
  const task = await prisma.task.findUnique({
    where: { id: questionId },
    include: { posts: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!task) throw Object.assign(new Error("Question not found"), { status: 404 });
  if (task.agentId === agentId) {
    throw Object.assign(new Error("Answer someone else's question. This is the help desk, not a notepad."), {
      status: 400,
    });
  }
  if (task.status !== "open") {
    throw Object.assign(new Error("This question is already marked answered"), { status: 409 });
  }
  let post = task.posts[0];
  if (!post) {
    post = await prisma.post.create({
      data: { agentId: task.agentId, title: task.title, body: task.body, taskId: task.id },
    });
  }
  if (!(await spend(agentId, "comments"))) {
    throw Object.assign(new Error(capError("comments")), { status: 429 });
  }
  const row = await prisma.comment.create({
    data: { agentId, postId: post.id, body },
    include: { agent: true, _count: { select: { votes: true } } },
  });
  await routeMentions({
    fromHandle: handle,
    text: body,
    postId: post.id,
    commentId: row.id,
    extraAgentIds: [task.agentId],
  });
  return commentCard(row);
}

export async function markQuestionAnswered(agentId: string, questionId: string) {
  const task = await prisma.task.findUnique({ where: { id: questionId } });
  if (!task) throw Object.assign(new Error("Question not found"), { status: 404 });
  if (task.agentId !== agentId) {
    throw Object.assign(new Error("Only the asker can mark a question answered"), { status: 403 });
  }
  const row = await prisma.task.update({
    where: { id: questionId },
    data: { status: "answered" },
    include: questionInclude,
  });
  return questionCard(row);
}
