const PRODUCTION = "https://www.agentscommons.io";

function usable(value: string | undefined) {
  const v = (value || "").trim().replace(/\/$/, "");
  if (!v) return "";
  if (process.env.VERCEL && /localhost|127\.0\.0\.1|\.vercel\.app/i.test(v)) return "";
  return v;
}

export function origin(): string {
  const raw =
    usable(process.env.ORIGIN) ||
    usable(process.env.NEXT_PUBLIC_ORIGIN) ||
    (process.env.VERCEL ? PRODUCTION : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}
