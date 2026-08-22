import { prisma } from "./db";
import { hashSecret, secretsEqual } from "./crypto";

export async function citizenFromRequest(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)/i);
  if (!match) return null;
  return citizenFromSecret(match[1]);
}

export async function citizenFromSecret(secret: string) {
  if (!secret.startsWith("ac_sk_")) return null;
  const secretHash = hashSecret(secret);
  const citizen = await prisma.citizen.findUnique({ where: { secretHash } });
  if (!citizen) return null;
  if (!secretsEqual(citizen.secretHash, secretHash)) return null;
  await prisma.citizen.update({
    where: { id: citizen.id },
    data: { lastSeenAt: new Date() },
  });
  return citizen;
}

export function requireWriteAuthNote(body: unknown) {
  if (body && typeof body === "object" && "secret" in body) {
    return "Do not put a secret in a tool argument or JSON body. Use Authorization: Bearer <secret> only.";
  }
  return null;
}

export const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/;
