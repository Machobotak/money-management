"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CrossIcon } from "@/components/ui/Modal";
import { Masthead, NavList } from "./Sidebar";

/** Drawn, not typed: three rules of the ruling. */
function MenuIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 12" className="h-3 w-4" fill="none">
      <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-stretch justify-between border-b border-rule-hair bg-paper/95 backdrop-blur md:hidden">
        <div className="fore-edge w-[5px] flex-none" aria-hidden />
        <Masthead className="flex-1 py-2.5" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka indeks"
          aria-expanded={open}
          className="flex w-14 flex-none items-center justify-center border-l border-rule-hair text-muted transition-colors hover:bg-block hover:text-ink"
        >
          <MenuIcon />
        </button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex bg-paper/85 backdrop-blur-[2px] md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="animate-slip flex h-full w-[80%] max-w-[280px] flex-col border-r border-rule-dense bg-paper"
          >
            <div className="flex items-center justify-between border-b border-rule-hair pr-3">
              <Masthead className="py-3" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup indeks"
                className="-mr-1 p-2 text-faint transition-colors hover:text-ink"
              >
                <CrossIcon className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
