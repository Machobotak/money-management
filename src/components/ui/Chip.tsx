"use client";

import { cn } from "@/lib/cn";

/**
 * An interval key on the scale strip. The chosen key is printed solid;
 * the ribbon is drawn by the parent so it can overshoot the column.
 */
export function FilterChip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "stamp relative h-7 rounded-sm border px-2.5 text-micro",
        "transition-colors duration-150",
        active
          ? "border-ink bg-ink text-paper"
          : "border-rule-hair bg-transparent text-muted hover:border-rule-dense hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type ChipTone = "success" | "warning" | "error" | "info" | "neutral";

/**
 * Tones map onto the ledger's own ink: money in is banker green, money out is
 * oxblood, movement is ultramarine. Never a filled pill — a ruled stamp.
 */
const TONES: Record<ChipTone, string> = {
  success: "text-cre border-cre/45",
  warning: "text-brass border-brass/45",
  error: "text-deb border-deb/45",
  info: "text-ult border-ult/45",
  neutral: "text-muted border-rule-dense",
};

export function StatusChip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "stamp inline-flex items-center rounded-sm border px-1.5 py-0.5 text-micro whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
