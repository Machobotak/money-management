"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Icons are drawn, never typed. One stroke weight across the app. */
export function CrossIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={className} fill="none">
      <path d="M2 2 10 10M10 2 2 10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * A form pasted onto the page. The sheet is inset from the ruling so the
 * background grid stays legible around it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([data-modal-close])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-paper/85 p-4 pt-10 backdrop-blur-[2px] sm:pt-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-slip w-full rounded-sm border border-rule-dense bg-block",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
        )}
      >
        <div className="rule-hair flex items-start justify-between gap-4 p-5">
          <div>
            <h2 className="text-head text-ink">{title}</h2>
            {description ? <p className="mt-1 text-body text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 -mt-1 rounded-sm p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <CrossIcon className="h-3 w-3" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="rule-hair flex flex-wrap items-center justify-end gap-2 border-b-0 border-t p-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
