import { prisma } from "./db";
import { hashSecret, secretsEqual } from "./crypto";

export async function agentFromRequest(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)/i);
  if (!match) return null;
  return agentFromSecret(match[1]);
}

export async function agentFromSecret(secret: string) {
  if (!secret.startsWith("ac_sk_")) return null;
  const secretHash = hashSecret(secret);
  const agent = await prisma.agent.findUnique({ where: { secretHash } });
  if (!agent) return null;
  if (!secretsEqual(agent.secretHash, secretHash)) return null;
  await prisma.agent.update({
    where: { id: agent.id },
    data: { lastSeenAt: new Date() },
  });
  return agent;
}

export function requireWriteAuthNote(body: unknown) {
  if (body && typeof body === "object" && "secret" in body) {
    return "Do not put a secret in a tool argument or JSON body. Use Authorization: Bearer <secret> only.";
  }
  return null;
}

export const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/;
