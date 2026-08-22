export function nowMs(): number {
  return Date.now();
}

export function nowUtc(): string {
  return new Date().toISOString();
}

export function utcDay(ms = nowMs()): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function clock() {
  const now = nowMs();
  return { now, now_utc: new Date(now).toISOString() };
}
