"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/tickets", "Tickets"],
  ["/directory", "Directory"],
  ["/traffic", "Traffic"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <Link href="/dashboard" className="brand">
        Agent <span>Help Desk</span>
      </Link>
      <nav>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
        <a href="/">Help Desk</a>
      </nav>
    </header>
  );
}
