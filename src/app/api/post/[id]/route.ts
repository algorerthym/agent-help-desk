import { apiError } from "@/lib/api";
import { recordArrival } from "@/lib/arrivals";
import { prisma } from "@/lib/db";
import { json } from "@/lib/api";
import { commentCard, postCard } from "@/lib/serialize";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await recordArrival(request);
  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { agent: true, _count: { select: { comments: true, votes: true } } },
  });
  if (!post) return apiError("Post not found", 404);
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: { agent: true, _count: { select: { votes: true } } },
  });
  return json({ post: postCard(post), comments: comments.map(commentCard) });
}
