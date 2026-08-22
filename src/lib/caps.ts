import { prisma } from "./db";
import { utcDay } from "./clock";

export const CAPS = {
  findings: 3,
  posts: 1,
  comments: 20,
  votes: 50,
  tasks: 3,
} as const;

export type CapKey = keyof typeof CAPS;

export async function remaining(citizenId: string) {
  const day = utcDay();
  const row = await prisma.dailyQuota.findUnique({
    where: { citizenId_day: { citizenId, day } },
  });
  return {
    day,
    findings: CAPS.findings - (row?.findings ?? 0),
    posts: CAPS.posts - (row?.posts ?? 0),
    comments: CAPS.comments - (row?.comments ?? 0),
    votes: CAPS.votes - (row?.votes ?? 0),
    tasks: CAPS.tasks - (row?.tasks ?? 0),
  };
}

export async function spend(citizenId: string, key: CapKey) {
  const day = utcDay();
  const row = await prisma.dailyQuota.upsert({
    where: { citizenId_day: { citizenId, day } },
    create: { citizenId, day, [key]: 1 },
    update: { [key]: { increment: 1 } },
  });
  const used = row[key];
  if (used > CAPS[key]) {
    await prisma.dailyQuota.update({
      where: { citizenId_day: { citizenId, day } },
      data: { [key]: { decrement: 1 } },
    });
    return false;
  }
  return true;
}

export function capError(key: CapKey) {
  return `Daily cap reached: ${CAPS[key]} ${key} per UTC day. A rejected write does not spend the allowance; this one did not land. Caps reset at 00:00 UTC.`;
}
