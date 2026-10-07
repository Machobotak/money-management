"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SITE } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * The index tabs along the fore-edge of the book. The active tab is marked by
 * the same ribbon that marks today in the sheets.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col" aria-label="Indeks buku">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "stamp relative block border-l border-rule-hair px-4 py-3 text-caption font-semibold normal-case tracking-wide transition-colors duration-150",
              active
                ? "bg-raised text-ink"
                : "text-faint hover:bg-block hover:text-ink",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute -left-px -top-px h-[calc(100%+2px)] w-0.5 bg-deb"
              />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Masthead({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("block px-3", className)}>
      <span className="block text-lead leading-tight text-ink">{SITE.name}</span>
      <span className="stamp text-caption text-faint">catatan pribadi</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[212px] border-r border-rule-hair bg-paper md:flex md:flex-col">
      <div className="fore-edge w-[5px] flex-none" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col py-5">
        <Masthead className="mb-5" />
        <NavList />
      </div>
    </aside>
  );
}
