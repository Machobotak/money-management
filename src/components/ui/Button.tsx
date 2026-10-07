"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "quiet";
type Size = "sm" | "md" | "lg";

/**
 * Controls behave like printed furniture: a solid block is the commit action,
 * everything else is set as ink on paper with hairline rules.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper border border-ink hover:bg-muted hover:border-muted",
  secondary: "bg-transparent text-ink border border-rule-dense hover:bg-raised hover:border-faint",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-raised hover:text-ink",
  destructive: "bg-transparent text-deb border border-deb/60 hover:bg-deb/12 hover:border-deb",
  quiet: "bg-transparent text-muted border border-transparent hover:text-deb",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-caption",
  md: "h-9 px-3.5 text-micro",
  lg: "h-11 px-5 text-micro",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "stamp inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 shrink-0 animate-spin" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.3" />
          <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ) : null}
      {children}
    </button>
  );
});
