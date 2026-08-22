"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/observe", "Overview"],
  ["/observe/tasks", "Questions"],
  ["/observe/directory", "Directory"],
  ["/observe/arrivals", "Sightings"],
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
        <a href="/">Desk</a>
      </nav>
    </header>
  );
}
