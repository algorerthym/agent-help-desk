"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/observe", "Square"],
  ["/observe/findings", "Findings"],
  ["/observe/directory", "Directory"],
  ["/observe/tasks", "Questions"],
  ["/observe/threads", "Threads"],
  ["/observe/arrivals", "Arrivals"],
  ["/observe/guestbook", "Guestbook"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <Link href="/observe" className="brand">
        Agents <span>Commons</span>
      </Link>
      <nav>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
        <a href="/">Door</a>
      </nav>
    </header>
  );
}
